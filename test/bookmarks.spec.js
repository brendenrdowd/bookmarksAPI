const knex = require('knex');
const app = require('../src/app');
const bookmarks = require('./bookmarks.fixture');

describe('bookmark endpoints work properly', () => {
  let db;

  before('connects to db', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db)
  })

  before('clears db', () => db('bookmarks').truncate())

  after('disconnect db', () => db.destroy())

  // beforeEach('clear db', () => db('bookmarks').truncate())

  afterEach('clear db', () => db('bookmarks').truncate())

  context('given there is data', () => {
    beforeEach('seed bookmarks', () => db.into('bookmarks').insert(bookmarks))

    it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
      return supertest(app)
        .get('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, bookmarks)
    })

    it('GET /bookmarks/:id responds with 200 and the specified bookmark', () => {
      const id = 2;
      return supertest(app)
        .get(`/bookmarks/${id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, bookmarks[id - 1])
    })

    it('GET /bookmarks/:id responds with 404 when id doesn\'t exist', () => {
      const id = 12;
      return supertest(app)
        .get(`/bookmarks/${id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404)
    })

    //insert test
    //update test
  })

  context('when there is no data', () => {
    it(`GET /bookmarks responds with 200 and an empty list`, () => {
      return supertest(app)
        .get('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, [])
    })
  })
})