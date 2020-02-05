require('dotenv').config()
const express = require('express'),
  morgan = require('morgan'),
  cors = require('cors'),
  helmet = require('helmet'),
  bookmarkRouter = require('./bookmarks/bookmarkRouter'),
  validateBearerToken = require('./validateBearerToken'),
  NODE_ENV = process.env.NODE_ENV || "development",
  app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(validateBearerToken)

//routing
app.use('/bookmarks',bookmarkRouter)

app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

module.exports = app;