'use strict'

/* eslint-env mocha */

const supertest = require('supertest')
const htmlparser = require('htmlparser')

const ReleasesTracker = require('.')

it('should generate RSS feed meet the requirements of IFTTT Feed Channel',
  function (done) {
    this.timeout(10000)

    const title = 'Releases tracker test'
    const description = 'Releases tracker description'
    const link = 'http://www.example.com/releases-tracker'

    const middleware = ReleasesTracker({
      title, description, link,
      repos: [ 'facebook/react', 'twbs/bootstrap' ]
    })

    supertest(middleware)
      .get('/')
      .expect(200)
      .expect('Content-Type', 'application/rss+xml')
      .end((err, res) => {
        if (err) return done(err)

        const handler = new htmlparser.RssHandler((err, feed) => {
          if (err) return done(err)

          feed.should.have.properties('title', 'link')
          feed.items.forEach((item) => {
            item.should.have.properties('title', 'id', 'pubDate')
            item.title.should.be.a.String().and.match(/facebook\/react|twbs\/bootstrap/)
            item.pubDate.should.be.a.Date()
          })

          feed.items[0].pubDate.should.be.above(feed.items[1].pubDate)
          done()
        })
        const parser = new htmlparser.Parser(handler)
        parser.parseComplete(res.text)
      })
  })
