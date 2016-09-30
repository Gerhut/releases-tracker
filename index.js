#!/usr/bin/env node

const _ = require('lodash')
const cheerio = require('cheerio')
const request = require('superagent')

const pkg = require('./package')

const ReleasesTracker = ({
  title = pkg.name,
  repos = []
}) => (request, response) => Promise.all(repos.map(getEntryList)).then((entryLists) => {
  const fullURL = getFullURL(request)
  const entries = _(entryLists).flatten().sortBy((entry) => {
    const $updated = cheerio(entry).find('updated')
    return -new Date($updated.text())
  }).take(10).value()
  const updated = cheerio(cheerio(entries).find('updated')[0]).text()
  const $ = cheerio.load(`<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xml:lang="en-US">
  <id>${fullURL}</id>
  <link type="application/atom+xml" rel="self" href="${fullURL}"/>
  <title>${title}</title>
  <updated>${updated}</updated>
</feed>`, { xmlMode: true })

  $('feed').append(entries)
  response.writeHead(200, {
    'Content-Type': 'application/atom+xml; charset=utf-8'
  })
  response.end($.xml())
}).catch((error) => {
  console.error(error)
  if (!response.headerSent) {
    response.writeHead(500, {
      'Content-Type': 'text/plain; charset=utf-8'
    })
  }
  if (!response.finished) {
    response.end(error.stack)
  }
})

const getEntryList = (repo) => request(`https://github.com/${repo}/releases.atom`)
  .buffer()
  .then(({ text }) => {
    const $ = cheerio.load(text, { xmlMode: true })
    const $entries = $('entry')
    const repoName = repo.match(/^.+\/(.+)$/)[1]
    $entries.find('title').text((index, text) => `${repoName} ${text}`)
    $entries.find('link').attr('href', (index, href) => `https://github.com${href}`)
    return $entries.toArray()
  })

const getFullURL = ({socket, headers, url}) => {
  let protocol
  if (socket.encrypted) {
    protocol = 'https'
  } else if ('x-forwarded-proto' in headers) {
    protocol = headers['x-forwarded-proto']
  } else {
    protocol = 'http'
  }

  let host
  if ('x-forwarded-host' in headers) {
    host = headers['x-forwarded-host'].split(',')[0]
  } else {
    host = headers['host']
  }

  return `${protocol}://${host}${url}`
}

module.exports = ReleasesTracker

if (require.main === module) {
  const http = require('http')

  const title = process.env.TITLE
  const repos = process.env.REPOS.split(':')

  const middleware = ReleasesTracker({ title, repos })
  const server = http.createServer(middleware)

  server.listen(process.env.PORT, () => {
    console.log('Server listenning on', server.address())
  })
}
