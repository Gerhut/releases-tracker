'use strict'

/* eslint-env mocha */

const supertest = require('supertest')
const htmlparser = require('htmlparser')

const ReleasesTracker = require('.')

it('should generate RSS feed meet the requirements of IFTTT Feed Channel',
  function (done) {
    this.timeout(10000)

    const middleware = ReleasesTracker([
      'jquery/jquery',
      'twbs/bootstrap'
    ])

    supertest(middleware)
      .get('/')
      .expect(200)
      .expect('Content-Type', 'application/rss+xml')
      .end((err, res) => {
        if (err) throw err

        const handler = new htmlparser.RssHandler((err, feed) => {
          if (err) throw err

          feed.should.have.properties('title', 'link')
          feed.items.forEach((item) => {
            item.should.have.properties('title', 'id', 'pubDate')
            item.title.should.be.a.String().and.match(/jquery\/jquery|twbs\/bootstrap/)
            item.pubDate.should.be.a.Date()
          })
          done()
        })
        const parser = new htmlparser.Parser(handler)
        parser.parseComplete(res.text)
      })
  })
