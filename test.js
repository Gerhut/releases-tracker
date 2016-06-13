'use strict'

/* eslint-env mocha */

const supertest = require('supertest')
const FeedParser = require('feedparser')

const ReleasesTracker = require('.')

it('should work', function (done) {
  this.timeout(10000)

  const middleware = ReleasesTracker([
    'jquery/jquery',
    'twbs/bootstrap'
  ])

  supertest(middleware)
    .get('/')
    .expect(200)
    .expect('Content-Type', 'application/rss+xml')
    .expect((res) => {
      const feedparser = new FeedParser()
      res.pipe(feedparser)
      feedparser.on('error', done)
      feedparser.on('readable', () => {
        let item
        while ((item = feedparser.read())) {
          item.title.should.be.a.String().and.match(/jquery\/jquery|twbs\/bootstrap/)
        }
      })
    })
    .end(done)
})
