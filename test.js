'use strict'

/* eslint-env mocha */

const cheerio = require('cheerio')
const request = require('supertest')

const ReleasesTracker = require('.')

it('should generate Atom feed meet the requirements of IFTTT Feed Channel',
  function (done) {
    this.timeout(10000)

    const middleware = ReleasesTracker({
      title: 'test',
      repos: [ 'facebook/react', 'twbs/bootstrap' ]
    })

    request(middleware)
      .get('/')
      .buffer()
      .on('error', done)
      .expect(200)
      .expect('Content-Type', 'application/atom+xml; charset=utf-8')
      .expect((response) => {
        const $ = cheerio.load(response.text, { xmlMode: true })
        $('feed > id').length.should.equal(1)
        $('feed > link').length.should.equal(1)
        $('feed > link').attr('href').should.ok()
        $('feed > title').length.should.equal(1)
        $('feed > title').text().should.equal('test')
        $('feed > updated').length.should.equal(1)
        const $entry = $('entry')
        $entry.length.should.belowOrEqual(10)
        const $updated = $entry.find('updated')
        new Date($($updated[0]).text()).should.aboveOrEqual(new Date($($updated[1]).text()))
        $entry.each((index, entry) => {
          $(entry).find('updated').length.should.be.ok()
          $(entry).find('id').length.should.be.ok()
        })
      })
      .end(done)
  })
