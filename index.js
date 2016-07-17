#!/usr/bin/env node

'use strict'

const superagent = require('superagent')
const Feed = require('feed')

const getLatestRelease = ({ repo, token }) => {
  const url = `https://api.github.com/repos/${repo}/releases`
  const request = superagent.get(url, { per_page: 1 })

  if (token != null) {
    request.set('Authorization', `token ${token}`)
  }

  return request.then((response) => response.body[0])
}

const repoReleaseToItem = ({ repo, release }) => ({
  title: `${repo} ${release.name}`,
  link: release.html_url,
  guid: release.html_url,
  date: new Date(release.created_at),
  content: release.body
})

const ReleasesTracker = ({ title, description, link, repos, token }) => (req, res) => {
  const items = repos.map(
    (repo) => getLatestRelease({ repo, token }).then(
      (release) => repoReleaseToItem({ repo, release })
    )
  )

  Promise.all(items).then((items) => {
    items.sort((itemA, itemB) => itemA.date - itemB.date).reverse()

    const feed = new Feed({
      title, description, link,
      updated: new Date(items[0].date)
    })
    items.forEach((item) => feed.addItem(item))

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

module.exports = ReleasesTracker

if (require.main === module) {
  const http = require('http')

  const title = process.env.TITLE
  const description = process.env.DESCRIPTION
  const link = process.env.LINK
  const repos = process.env.REPOS.split(':')
  const token = process.env.TOKEN

  const middleware = ReleasesTracker({ title, description, link, repos, token })
  const server = http.createServer(middleware)

  server.listen(process.env.PORT, () => {
    console.log('Server listenning on', server.address())
  })
}
