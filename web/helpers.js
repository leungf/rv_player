var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var config = require('config-lite')(__dirname);

var _getDirList = function(request, response) {
  var r = '<ul class="jqueryFileTree" style="display: none;">';
  try {
    var dir = decodeURIComponent(request.body.dir);
    r = '<ul class="jqueryFileTree" style="display: none;">';
    var files = fs.readdirSync(dir);
    files.forEach(function(f) {
      var ff = dir + f;
      var stats = fs.statSync(ff)
      if (stats.isDirectory()) {
        r += '<li class="directory collapsed"><a href="#" rel="' + ff + '/">' + f + '</a></li>';
      } else {
        var comps = f.split('.')
        var e = comps[comps.length - 1].toLowerCase();
        if (config.allowExts) {
          if (config.allowExts.includes(e)) {
            r += '<li class="file ext_' + e + '"><a href="#" rel="' + ff + '">' + f + '</a></li>';
          }
        } else {
          r += '<li class="file ext_' + e + '"><a href="#" rel="' + ff + '">' + f + '</a></li>';
        }
      }
    });
    r += '</ul>';
  } catch (e) {
    console.error(e);
    r += 'Could not load directory: ' + dir;
    r += '</ul>';
  }
  response.send(r)
}

var _loadMovie = async function(request, response) {
  var fpath = request.body.path;
  var root_dir = config.dirRoot;
  var sub_fpath = fpath.substr(root_dir.length, fpath.length - root_dir.length);
  var static_dir = path.join(__dirname, 'public'); // same as app.js
  var relative_root_dir = path.join(static_dir, 'videoLinks'); // could be configuired
  // console.log(relative_root_dir);

  // check path
  // get the relative local path in public
  if (sub_fpath[0] != '/')
    sub_fpath = '/' + sub_fpath;

  var stats = fs.statSync(fpath);
  var data = {
    message: '',
    status: 0,
    data: null,
  } // 0: failed, 1: success
  if (stats.isFile()) {
    var relative_path_file = relative_root_dir + sub_fpath;
    var relative_path_dir = path.dirname(relative_path_file);
    try {
      if (!fs.existsSync(relative_path_dir)) {
        mkdirp.sync(relative_path_dir)
      }

      if (fs.existsSync(relative_path_file))
        fs.unlinkSync(relative_path_file)

      // console.log(fpath)
      // console.log(relative_path_file)
      fs.symlinkSync(fpath, relative_path_file);
      data.message = "success";
      data.status = 1;
      data.video_path = relative_path_file.substr(static_dir.length, relative_path_file.length - static_dir.length);
      request.session.fpath = fpath;
    } catch (err) {
      console.log(err);
      data.message = err.message;
    }
  } else {
    data.message = "failed due to directory can not be load. set the movie file."
  }
  response.send(data);
}

module.exports.getDirList = _getDirList;

module.exports.loadMovie = _loadMovie;
