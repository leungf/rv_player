'use strict';

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

var _linkFileSync = function(original_base_path, symlink_base_path, relative_file_path) {
  var orignal_file_path = path.join(original_base_path, relative_file_path);
  var target_link_path = path.join(symlink_base_path, relative_file_path);
  var ret = {}
  try {
    if (!fs.existsSync(target_link_path)) {
      var _dir = path.dirname(target_link_path);
      mkdirp.sync(_dir);
    }

    if (fs.existsSync(target_link_path)) {
      fs.unlinkSync(target_link_path)
    }

    fs.symlinkSync(orignal_file_path, target_link_path);
    ret.status = 1;
  } catch (err) {
    console.log(err);
    ret.status = 0;
    ret.message = err.message;
  }

  return ret;
}

// create soft link on server and return the file path
var _loadMovie = async function(request, response) {
  var full_file_path = request.body.path; // full file path
  var original_base_path = config.dirRoot;
  var relative_file_path = full_file_path.substr(
    original_base_path.length,
    full_file_path.length - original_base_path.length
  );
  var _static_dir = path.join(__dirname, 'public'); // same as app.js
  var symlink_base_path = path.join(_static_dir, 'videoLinks'); // could be configuired
  // console.log(relative_root_dir);

  var ret = {
    message: null,
    status: 0,
  } // 0: failed, 1: file success , 2: dir success

  // check path
  // 1. get the relative path in public
  if (relative_file_path[0] != '/')
    relative_file_path = '/' + relative_file_path;

  // 2. check the original file path from request
  var stats = fs.statSync(full_file_path);
  if (stats.isFile()) {
    var _ret = _linkFileSync(original_base_path, symlink_base_path, relative_file_path);
    if (!_ret.status)
      throw new Error(_ret.message);
    ret.status = 1;
    ret.video = {
      name: path.basename(relative_file_path),
      src: path.join('/videoLinks', relative_file_path),
    }
  } else if (stats.isDirectory()) {
    // currently, not support recursively loading the movies
    var files = fs.readdirSync(full_file_path);
    var relative_files = [];
    files.forEach(function(f) {
      var ff = full_file_path + f;
      var stats = fs.statSync(ff)
      if (stats.isDirectory()) {
        // TODO
      } else {
        var comps = f.split('.')
        var e = comps[comps.length - 1].toLowerCase();
        var relative_file_path = ff.substr(original_base_path.length, ff.length - original_base_path.length);
        var _ret = null;
        if (config.allowExts) {
          if (config.allowExts.includes(e)) {
            _ret = _linkFileSync(original_base_path, symlink_base_path, relative_file_path);
          }
        } else {
          _ret = _linkFileSync(original_base_path, symlink_base_path, relative_file_path);
        }
        if (_ret && _ret.status) {
          relative_files.push({
            name: path.basename(relative_file_path),
            src: path.join('/videoLinks', relative_file_path),
          });
        }
      }
    });
    ret.videos = relative_files;
    ret.status = 2;
  } else {
    ret.message = "failed due to directory can not be load. set the movie file."
  }

  // update the session
  if (ret.status != 0) {
    request.session.fpath = full_file_path;
  }
  response.send(ret);
}

module.exports.getDirList = _getDirList;

module.exports.loadMovie = _loadMovie;
