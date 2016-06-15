#!/usr/bin/env node

'use strict'

const superagent = require('superagent')
const Feed = require('feed')

const packageInfo = require('./package')

const getRecentTag = (repo) => {
  const tag = { repo }
  return superagent
    .get(`https://api.github.com/repos/${repo}/tags`)
    .query({ per_page: 1 })
    .then((res) => {
      const tagInfo = res.body[0]
      tag.name = tagInfo.name
      tag.commit = tagInfo.commit.sha
      return superagent.get(tagInfo.commit.url)
    })
    .then((res) => {
      const commit = res.body.commit
      tag.date = new Date(Date.parse(commit.committer.date))
      return tag
    })
}

const ReleasesTracker = module.exports = (repos) => (req, res) => {
  Promise.all(repos.map(getRecentTag)).then((tags) => {
    const feed = new Feed({
      title: packageInfo.name,
      description: packageInfo.description,
      link: packageInfo.homepage
    })
    tags.forEach((tag) => feed.addItem({
      title: `${tag.repo} ${tag.name} released`,
      link: `https://github.com/${tag.repo}/releases/tag/${tag.name}`,
      guid: `https://github.com/${tag.repo}/commit/${tag.commit.sha}`,
      date: tag.date
    }))
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml'
    })
    res.end(feed.render())
  }).catch((err) => {
    res.writeHead(500, err.message, {
      'Content-Type': 'text/plain'
    })
    res.end(err.stack)
  })
}

if (require.main === module) {
  const http = require('http')
  const repos = process.env.REPOS.split(':')
  const middleware = ReleasesTracker(repos)
  const server = http.createServer(middleware)
  server.listen(process.env.PORT, () => {
    console.log(`Server listenning on ${server.address()}`)
  })
}
