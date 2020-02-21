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

  describe('GET /bookmarks', () => {
    context('given there is no data in database', () => {
      it(`GET /bookmarks responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('given there is data in database', () => {
      beforeEach('seed bookmarks', () => db.into('bookmarks').insert(bookmarks))

      it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
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
          .get(`/bookmarks`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title)
            expect(res.body[0].description).to.eql(expectedBookmark.description)
          })
      })
    })
  })

  describe('GET /bookmarks/:id', () => {
    context('given there is no data in database', () => { })
    context('given there is data in database', () => {
      beforeEach('seed bookmarks', () => db.into('bookmarks').insert(bookmarks))

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
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title)
            expect(res.body.description).to.eql(expectedBookmark.description)
          })
      })
    })
  })

  describe('DELETE /bookmarks/:id', () => {
    context('given there is no data in database', () => {
      it('give us a 404 error', () => {
        const id = 12;
        return supertest(app)
          .delete(`/bookmarks/${id}`)
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
          .delete(`/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() => {
            return supertest(app)
              .get('/bookmarks')
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmarks)
          })
      })
    })
  })

  describe('POST /bookmarks', () => {
    it('responds with 400 if no title is supplied', () => {
      const newBookmark = {
        url: "google.com",
        rating: 1
      }
      return supertest(app)
        .post('/bookmarks')
        .send('newBookmark')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: 'Title is required' }
        })
    })

    it('responds with 400 if no url is supplied', () => {
      const newBookmark = {
        title: "google.com",
        rating: 1
      }
      return supertest(app)
        .post('/bookmarks')
        .send('newBookmark')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: 'URL is required' }
        })
    })

    it('responds with 400 if no rating is supplied', () => {
      const newBookmark = {
        url: "google.com",
        title: "Gergle"
      }
      return supertest(app)
        .post('/bookmarks')
        .send('newBookmark')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: 'Rating is required' }
        })
    })

    it('POST /bookmarks responds with 201 and returns created bookmark', () => {
      const newBookmark = {
        title: 'Old Search Engine',
        description: 'It is old.',
        url: 'oldy.com',
        rating: 3
      }

      return supertest(app)
        .post('/bookmarks')
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
            .get(`/bookmarks/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        })
    })

    it('remove XSS attack content', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      return supertest(app)
        .post('/bookmarks')
        .send(maliciousBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
    })
  })

  describe('PATCH /bookmarks/:id', () => {
    context('given there is no data in database', () => {
      it('give us a 404 error when it can\'t find the bookmark', () => {
        const id = 12;
        return supertest(app)
          .patch(`/bookmarks/a${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404)
      })
    })

    context('given there is data in database', () => {
      beforeEach('seed bookmarks', () => db.into('bookmarks').insert(bookmarks))

      const updatedBookmark = {
        description: 'Maybe not the best',
        rating: 1,
      };

      it('responds with 204 and properly updates bookmark in table', () => {
        const id = 1
        const expectedBookmark = {
          ...bookmarks[id - 1],
          ...updatedBookmark
        }
        return supertest(app)
          .patch(`/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updatedBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/bookmarks/${id}`)
              .expect(expectedBookmark)
          )
      })

      it('responds with 400 if no values are supplied', () => {
        return supertest(app)
          .patch(`/bookmarks/1`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400)
      })
    })
  })
})