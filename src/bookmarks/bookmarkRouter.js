const express = require('express');
const bodyparser = express.json();
const bookmarkRouter = express.Router();
const logger = require('../logger');
const bookmarksService = require('./bookmarksService');

bookmarkRouter.route('/')
  .get((req, res) => {
    const db = req.app.get('db')
    bookmarksService.getAll(db).then(result => {
      res.send(result)
    })
  })
  .post(bodyparser, (req, res) => {
    console.log(req.body)
    // validations
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
      title,
      url,
      description,
      rating
    };

    const db = req.app.get('db')
    bookmarksService.insertBookmark(db, bookmark).then(result => {
      logger.info(`Bookmark with id ${result.id} created`);
      res
        .status(201)
        .location(`http://localhost:8000/bookmark/${result.id}`)
        .json(result);
    })
  })

bookmarkRouter.route('/:id')
  .get((req, res) => {
    const id = req.params.id;
    const db = req.app.get('db')
    bookmarksService.getById(db, id).then(result => {
      if (!result) {
        res.status(404).send()
      }
      res.send(result)
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
      res
        .status(204)
        .end();
    })
  })

module.exports = bookmarkRouter
