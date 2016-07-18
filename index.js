#!/usr/bin/env node

'use strict'

const superagent = require('superagent')
const Feed = require('feed')

const getReleases = ({ repo, token }) => {
  const url = `https://api.github.com/repos/${repo}/releases`
  const request = superagent.get(url)

  if (token != null) {
    request.set('Authorization', `token ${token}`)
  }

  return request.then((response) => response.body)
}

const getItem = ({ release, repo }) => ({
  title: `${repo} ${release.name || release.tag_name}`,
  link: release.html_url,
  guid: release.html_url,
  date: new Date(release.created_at)
})

const ReleasesTracker = ({ title, description, link, repos, token }) => (req, res) => {
  const itemLists = repos.map(
    (repo) => getReleases({ repo, token }).then(
      (releases) => releases.map(
        (release) => getItem({ release, repo })
      )
    )
  )

  Promise.all(itemLists).then((itemLists) => {
    const items = itemLists.reduce((itemListA, itemListB) => itemListA.concat(itemListB))
    items.sort((itemA, itemB) => itemA.date - itemB.date).reverse().splice(10)

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
