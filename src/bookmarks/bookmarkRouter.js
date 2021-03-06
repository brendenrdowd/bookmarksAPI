const express = require('express');
const bodyparser = express.json();
const bookmarkRouter = express.Router();
const logger = require('../logger');
const bookmarksService = require('./bookmarksService');
const xss = require('xss');
const { isWebUri } = require('valid-url')

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})

//add REGEX validations

bookmarkRouter.route('/')
  .get((req, res) => {
    const db = req.app.get('db')
    bookmarksService.getAll(db)
      .then(result => {
        res.json(result.map(serializeBookmark))
      })
  })
  .post(bodyparser, (req, res, next) => {
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `'${field}' is required` }
        })
      }
    }

    const { title, url, rating, description } = req.body;

    const ratingNum = Number(rating)

    if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send({
        error: { message: `'rating' must be a number between 0 and 5` }
      })
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send({
        error: { message: `'url' must be a valid URL` }
      })
    }

    const bookmark = {
      title: xss(title),
      url,
      description: xss(description),
      rating
    };

    const db = req.app.get('db')
    bookmarksService.insertBookmark(db, bookmark)
      .then(result => {
        logger.info(`Bookmark with id ${result} created`);
        res
          .status(201)
          .location(`http://localhost:8000/bookmark/${result.id}`)
          .json(result);
      })
  })//end post

bookmarkRouter.route('/:id')
  .all((req, res, next) => {
    const id = req.params.id;
    const db = req.app.get('db')
    bookmarksService.getById(db, id).then(result => {
      if (!result) {
        return res.status(404).send()
      }
      else {
        next()
      }
    })
  })
  .get((req, res) => {
    const id = req.params.id;
    const db = req.app.get('db')
    bookmarksService.getById(db, id).then(result => {
      if (!result) {
        return res.status(404).send()
      }
      res.json(serializeBookmark(result))
    })
  })
  .patch(bodyparser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = { title, url, description, rating }

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
        }
      })
    }

    bookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        return res.status(204).end()
      })
      .catch(next)
  })
  .delete((req, res) => {
    const id = req.params.id;
    const db = req.app.get('db')

    bookmarksService.deleteBookmark(db, id).then(result => {
      logger.info(`Bookmark with id ${result.id} deleted.`);
      if (!result) {
        res.status(404).end()
      }
      res
        .status(204)
        .end();
    })
  })

module.exports = bookmarkRouter
