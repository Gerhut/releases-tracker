#!/usr/bin/env node

'use strict'

const co = require('co')
const _ = require('lodash')
const Feed = require('feed')
const Redis = require('ioredis')
const marked = require('marked')
const request = require('request-promise')

const PACKAGE = require('./package')

const ReleasesTracker = ({
  title = PACKAGE.name,
  description = PACKAGE.description,
  link = PACKAGE.homepage,
  repos = [],
  redisUrl
}) => (req, res) => co(function * () {
  const redis = redisUrl != null ? new Redis(redisUrl) : null

  const getRepoReleases = function * (repo) {
    const uri = `https://api.github.com/repos/${repo}/releases`
    const headers = { 'user-agent': `${PACKAGE.name}/${PACKAGE.version}` }

    const etag = redis && (yield redis.get(`${repo}:etag`))
    if (etag) headers['if-none-match'] = etag

    try {
      const response = yield request({ uri, headers, resolveWithFullResponse: true })
      if (redis) {
        redis.set(`${repo}:body`, response.body)
        redis.set(`${repo}:etag`, response.headers.etag)
      }
      return JSON.parse(response.body)
    } catch (error) {
      if (error.statusCode === 304) {
        const body = yield redis.get(`${repo}:body`)
        return JSON.parse(body)
      } else {
        throw error
      }
    }
  }

  const feedItems = _(yield _.map(repos, function * (repo) {
    const releases = yield getRepoReleases(repo)

    return _.map(releases, (release) => ({
      title: `${repo.split('/').pop()} ${release.name || release.tag_name}`,
      link: release.html_url,
      guid: release.url,
      date: new Date(release.created_at),
      content: marked(release.body)
    }))
  })).flatten().sortBy((feedItem) => -feedItem.date).take(10).value()

  const feed = new Feed({
    title,
    description,
    link,
    updated: new Date(feedItems[0].date)
  })
  feedItems.forEach((feedItem) => feed.addItem(feedItem))

  res.writeHead(200, { 'content-type': 'application/rss+xml' })
  res.end(feed.render())
}).catch((err) => {
  console.error(err)
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
  const redisUrl = process.env.REDIS_URL

  const middleware = ReleasesTracker({ title, description, link, repos, redisUrl })
  const server = http.createServer(middleware)

  server.listen(process.env.PORT, () => {
    console.log('Server listenning on', server.address())
  })
}
