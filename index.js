#!/usr/bin/env node

'use strict'

const superagent = require('superagent')
const Feed = require('feed')

const packageInfo = require('./package')

const getRecentTag = (repo) => superagent
  .get(`https://api.github.com/repos/${repo}/tags`)
  .query({ per_page: 1 })
  .then((res) => Object.assign(res.body[0], { repo }))

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
      guid: `https://github.com/${tag.repo}/commit/${tag.commit.sha}`
    }))
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml'
    })
    res.end(feed.render())
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
