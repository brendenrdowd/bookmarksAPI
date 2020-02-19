const bookmarksService = {
  getAll(db) {
    return db.select('*').from('bookmarks')
  },
  getById(db, id) {
    return db.select('*').from('bookmarks').where('id', id).first()
  },
  insertBookmark(db, newBookmark) {
    return db.from('bookmarks').returning('*').insert(newBookmark).then(res => {
      return res[0]
    })
  },
  updateBookmark(db, id, newData) {
    return db('bookmarks').where({ id }).update(newData)
  },
  deleteBookmark(db, id) {
    return db('bookmarks').where({ id }).delete()
  }
}

module.exports = bookmarksService;