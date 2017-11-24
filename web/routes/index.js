var express = require('express');
var router = express.Router();
var config = require('config-lite')(__dirname);

/* GET home page. */
router.get('/', function(req, res, next) {
  var request_movie_path = null;
  if (req.session.fpath) {
    request_movie_path = req.session.fpath;
  }
  res.render('index', {
    dirRoot: config.dirRoot,
    fPath: request_movie_path
  });
});

module.exports = router;
