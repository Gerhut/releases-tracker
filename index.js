#!/usr/bin/env node

'use strict'

const _ = require('lodash')
const Feed = require('feed')
const request = require('request-promise')

const PACKAGE = require('./package')

const getReleases = (repo) => {
  const url = `https://api.github.com/repos/${repo}/releases`
  return request(url, {
    headers: {
      'user-agent': `${PACKAGE.name}/${PACKAGE.version}`
    },
    json: true
  })
}

const createFeedItem = ({ release, repo }) => ({
  title: `${repo.split('/')[1]} ${release.name || release.tag_name}`,
  link: release.html_url,
  guid: release.url,
  date: new Date(release.created_at)
})

const ReleasesTracker = ({
  title = PACKAGE.name,
  description = PACKAGE.description,
  link = PACKAGE.homepage,
  repos = []
}) => (req, res) =>
  Promise.all(_.map(repos,
    (repo) => getReleases(repo).then(
      (releases) => _.map(releases,
        (release) => createFeedItem({ release, repo })))))
  .then(_.flatten)
  .then((items) => _(items).sortBy('date').reverse().take(10).value())
  .then((items) => {
    const feed = new Feed({
      title,
      description,
      link,
      updated: new Date(items[0].date)
    })
    items.forEach((item) => feed.addItem(item))

    res.writeHead(200, {
      'Content-Type': 'application/rss+xml'
    })
    res.end(feed.render())
  })
  .catch((err) => {
    res.writeHead(500, err.message, { 'content-type': 'text/plain' })
    res.end(err.stack)
  })

module.exports = ReleasesTracker

if (require.main === module) {
  const http = require('http')

  const title = process.env.TITLE
  const description = process.env.DESCRIPTION
  const link = process.env.LINK
  const repos = process.env.REPOS.split(':')

  const middleware = ReleasesTracker({ title, description, link, repos })
  const server = http.createServer(middleware)

  server.listen(process.env.PORT, () => {
    console.log('Server listenning on', server.address())
  })
}
