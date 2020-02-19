const bookmarks = [
    {
      id: 1,
      title: 'Google',
      url: 'https://www.google.com',
      description: 'The best',
      rating: 4,
    },
    {
      id: 2,
      title: 'Bing',
      url: 'https://www.bing.com',
      description: 'nice try, microsoft',
      rating: 1,
    },
    {
      id: 3,
      title: 'dogpile',
      url: 'https://dogpile.com',
      description: 'the only real search engine',
      rating: 5,
    }
  ]

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://www.hackers.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 1,
  }
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousBookmark,
    expectedBookmark,
  }
}

module.exports = {
  bookmarks,
  makeMaliciousBookmark,
}