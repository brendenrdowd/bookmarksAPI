const express = require('express');
const bodyparser = express.json();
const bookmarkRouter = express.Router();
const logger = require('../logger');
const bookmarksService = require('./bookmarksService');
const xss = require('xss');

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
  .post(bodyparser, (req, res) => {
    const { title, url, rating, description } = req.body;
    if (!title) {
      logger.error(`Title is required`);
      return res
        .status(400)
        .send('Invalid title');
    }
    if (!url) {
      logger.error(`Url is required`);
      return res
        .status(400)
        .send('Invalid url');
    }
    if (!rating) {
      logger.error(`Rating is required`);
      return res
        .status(400)
        .send('Invalid Rating');
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
  // .put(bodyparser, (req, res) => {
  //   const id = req.params.id;
  //   const db = req.app.get('db');

  //   const bookmark = {
  //     title,
  //     url,
  //     description,
  //     rating
  //   };

  //   bookmarksService.updateBookmark(db, id)
  // })
  .delete((req, res) => {
    const id = req.params.id;
    const db = req.app.get('db')

    bookmarksService.deleteBookmark(db, id).then(result => {
      logger.info(`Bookmark with id ${result.id} deleted.`);
      if(!result) {
        res.status(404).end()
      }
      res
        .status(204)
        .end();
    })
  })

module.exports = bookmarkRouter
