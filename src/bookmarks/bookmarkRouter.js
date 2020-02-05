const express = require('express');
const bodyparser = express.json();
const bookmarkRouter = express.Router();
const logger = require('../logger');
const store = require('../store');
const uuid = require('uuid/v4');

bookmarkRouter.route('/')
  .get((req, res) => {
    console.log(store)
    res.json(store);
  })
  .post(bodyparser,(req, res) => {
    console.log(req.body)
    // validations
    const { title, url } = req.body;
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
    // creating a new bookmark
    const id = uuid();
    const bookmark = {
      id: id,
      title: title,
      url: url
    };
    store.push(bookmark);
    logger.info(`Bookmark with id ${id} created`);
    res
      .status(201)
      .location(`http://localhost:8000/bookmark/${id}`)
      .json(bookmark);
  })

bookmarkRouter.route('/:id')
  .get((req, res) => {
    const id = req.params.id;
    const bookmarkIndex = store.findIndex(bm => bm.id == id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not Found');
    }
    res.json(store[bookmarkIndex])
  })
  .delete((req, res) => {
    const id = req.params.id;
    const bookmarkIndex = store.findIndex(bm => bm.id == id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not Found');
    }
    store.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res
      .status(204)
      // .location(`http://localhost:8000/bookmark/`)
      .end(); 
  })

module.exports = bookmarkRouter
