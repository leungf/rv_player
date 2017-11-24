'use strict';

module.exports = {
  dirRoot: '/Users/valder/Movies',
  debug: false,
  url: 'mongodb://localhost:27017/rv_play',
  session: {
    name: 'SID',
    secret: 'SID',
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    }
  },
  allowExts: ['mp4'],
}
