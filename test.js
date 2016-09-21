'use strict'

/* eslint-env mocha */

const supertest = require('supertest')
const FeedParser = require('feedparser')

const ReleasesTracker = require('.')

it('should generate RSS feed meet the requirements of IFTTT Feed Channel',
  function (done) {
    this.timeout(10000)

    const middleware = ReleasesTracker({
      repos: [ 'facebook/react' ],
      redisUrl: 'redis://127.0.0.1'
    })

    const feedparser = new FeedParser()

    supertest(middleware)
      .get('/')
      .on('error', done)
      .expect(200)
      .expect('Content-Type', 'application/rss+xml')
      .pipe(feedparser)
      .on('error', done)
      .on('readable', () => {
        feedparser.meta.should.have.properties('title', 'link')

        let lastItem, item
        while ((item = feedparser.read())) {
          item.should.have.properties('title', 'guid', 'pubdate')
          item.title.should.be.a.String().and.match(/^react|^bootstrap/)
          item.pubdate.should.be.a.Date()
          if (lastItem) item.pubdate.should.be.below(lastItem.pubdate)
          lastItem = item
        }
      })
      .on('end', done)
  })
