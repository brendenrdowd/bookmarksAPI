const knex = require('knex');
const app = require('../src/app');
const { bookmarks, makeMaliciousBookmark } = require('./bookmarks.fixture');

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

  afterEach('clear db', () => db('bookmarks').truncate())

  describe('GET /api/bookmarks', () => {
    context('given there is no data in database', () => {
      it(`GET /api/bookmarks responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('given there is data in database', () => {
      beforeEach('seed bookmarks', () => db.into('bookmarks').insert(bookmarks))

      it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, bookmarks)
      })
    })
    context('given there is a XSS attack', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title)
            expect(res.body[0].description).to.eql(expectedBookmark.description)
          })
      })
    })
  })

  describe('GET /api/bookmarks/:id', () => {
    context('given there is no data in database', () => { })
    context('given there is data in database', () => {
      beforeEach('seed bookmarks', () => db.into('bookmarks').insert(bookmarks))

      it('GET /api/bookmarks/:id responds with 200 and the specified bookmark', () => {
        const id = 2;
        return supertest(app)
          .get(`/api/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, bookmarks[id - 1])
      })

      it('GET /api/bookmarks/:id responds with 404 when id doesn\'t exist', () => {
        const id = 12;
        return supertest(app)
          .get(`/api/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404)
      })
    })
    context('given there is a XSS attack', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title)
            expect(res.body.description).to.eql(expectedBookmark.description)
          })
      })
    })
  })

  describe('DELETE /api/bookmarks/:id', () => {
    context('given there is no data in database', () => {
      it('give us a 404 error', () => {
        const id = 12;
        return supertest(app)
          .delete(`/api/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404)
      })
    })
    context('given there is data in database', () => {
      beforeEach('seed bookmarks', () => db.into('bookmarks').insert(bookmarks))

      it('should return a 204 and delete the item from the database', () => {
        const id = 2;
        const expectedBookmarks = bookmarks.filter(bookmark => bookmark.id !== id)
        return supertest(app)
          .delete(`/api/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() => {
            return supertest(app)
              .get('/api/bookmarks')
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmarks)
          })
      })
    })
  })

  describe('POST /api/bookmarks', () => {
    it('responds with 400 if no title is supplied', () => {
      const newBookmark = {
        url: "http://google.com",
        rating: 1
      }
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: "'title' is required" }
        })
    })

    it('responds with 400 if no url is supplied', () => {
      const newBookmark = {
        title: "google.com",
        rating: 1
      }
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: "'url' is required" }
        })
    })

    it('responds with 400 if no rating is supplied', () => {
      const newBookmark = {
        title: "Gergle",
        url: "google.com"
      }
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: "'rating' is required"}
        })
    })

    it('POST /api/bookmarks responds with 201 and returns created bookmark', () => {
      const newBookmark = {
        title: 'Old Search Engine',
        description: 'It is old.',
        url: 'http://oldy.com',
        rating: 3
      }

      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body).to.have.property('id')
        })
        .then(res => {
          return supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        })
    })

    it('remove XSS attack content', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      return supertest(app)
        .post('/api/bookmarks')
        .send(maliciousBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
    })
  })

  describe('PATCH /api/bookmarks/:id', () => {
    context('given there is no data in database', () => {
      it('give us a 404 error when it can\'t find the bookmark', () => {
        const id = 12;
        return supertest(app)
          .patch(`/api/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404)
      })
    })

    context('given there is data in database', () => {
      beforeEach('seed bookmarks', () => db.into('bookmarks').insert(bookmarks))

      it('responds with 204 and returns no content', () => {
        const id = 1;
        const updatedBookmark = {
          description: 'Maybe not the best',
          rating: 1,
        };
        return supertest(app)
          .patch(`/api/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updatedBookmark)
          .expect(204)
      })

      it('properly updates bookmark in table', () => {
        const updatedBookmark = {
          description: 'Maybe not the best',
          rating: 1,
        };
        
        const id = 1
        const expectedBookmark = {
          ...bookmarks[id - 1],
          ...updatedBookmark
        }

        return supertest(app)
          .patch(`/api/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updatedBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${id}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmark)
          )
      })

      it('responds with 400 if no values are supplied', () => {
        return supertest(app)
          .patch(`/api/bookmarks/1`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400)
      })

      it('responds with 404 if bookmark id isn\'t supplied as URL param', () => {
        return supertest(app)
          .patch(`/api/bookmarks/`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404)
      })
    })
  })
})