// Allow to CTRL-C
process.stdin.setRawMode(true);
process.stdin.on('data', function (b) {
  if (b[0] === 3) {
    process.stdin.setRawMode(false)
    process.exit()
  }
});

var Promise = require('bluebird');
var _ = require('lodash');
var image_downloader = require('image-downloader');
var mkdirp = require('mkdirp');
var path = require('path');
var URL = require('url');
var fs = require('fs');

var username = 'yanu';
var downloadPath = path.join('./downloads', username);
var batchSize = 10;

mkdirp.sync(downloadPath);

if (!(process.env.FLICKR_API_KEY &&
  process.env.FLICKR_API_SECRET &&
  process.env.FLICKR_USER_ID)) {
  throw new Error('Missing keys')
}


var Flickr = require("flickrapi"),
  flickrOptions = {
    api_key: process.env.FLICKR_API_KEY,
    secret: process.env.FLICKR_API_SECRET,
    user_id: process.env.FLICKR_USER_ID
  };

if (process.env.FLICKR_ACCESS_TOKEN && process.env.FLICKR_ACCESS_TOKEN_SECRET) {
  flickrOptions.access_token = process.env.FLICKR_ACCESS_TOKEN;
  flickrOptions.access_token_secret = process.env.FLICKR_ACCESS_TOKEN_SECRET;
}

var urls = [
  'url_o',
  'url_k',
  'url_h',
  'url_l',
  'url_c',
  'url_z',
  'url_n',
  'url_m'
];


function downloadPhoto(photo) {
  return new Promise(function (resolve, reject) {
    var url = '';
    _.each(urls, function (u) {
      if (photo.hasOwnProperty(u)) {
        url = photo[u];
        return false;
      }
    });

    console.log('about to download', photo.title, photo.id);
    var parsedUrl = URL.parse(url);
    if (parsedUrl.pathname) {
      var pathName = path.join(downloadPath, path.basename(parsedUrl.pathname));
      fs.stat(pathName, function (err, stats) {
        if (!err && stats.isFile()) {
          //console.log('file exists', pathName);
          return resolve(pathName);
        } else {
          console.log('downloading', photo.title, photo.id);
          var options = {
            url: url,
            dest: downloadPath,
            done: function (err, filename, image) {
              if (err) {
                console.log(photo);
                reject(err);
              }
              resolve(filename);
            }
          };
          image_downloader(options);
        }
      });
    }
  });
}

function download(photos) {
  var downloadPromises = [];
  _.each(photos, function (photo) {
    downloadPromises.push(downloadPhoto(photo));
  });

  return Promise.all(downloadPromises);
}

Flickr.authenticate(flickrOptions, function (error, flickr) {
  flickr.people.findByUsername({
    username: username
  }, function (err, result) {
    if (err) {
      throw new Error(err);
    }
    console.log('Downloading photos from ', username, result.user.id);

    function getPhotos(pageToGet) {
      return new Promise(function (resolve, reject) {
        flickr.photos.search({
          authenticated: true,
          user_id: result.user.id,
          per_page: batchSize,
          page: pageToGet,
          extras: 'original_format,' + urls.join(',')
        }, function (err, result) {
          if (err) reject(err);
          if (result.stat !== 'ok') {
            reject(result);
          } else {
            resolve(result.photos)
          }
        });
      })
    }

    var promiseWhile = Promise.method(function (condition, action) {
      return condition()
        .then(function (res) {
          if (res) {
            return action().then(promiseWhile.bind(null, condition, action));
          } else {
            return null;
          }
        });
    });

    var page = 1;
    return getPhotos(page)
      .then(function (photos) {
        return promiseWhile(
          function condition() {
            console.log('processing page', page);
            return Promise.resolve(photos.pages > page);
          },
          function action() {
            console.log('getting another batch');
            return download(photos.photo)
              .then(function (downloadResult) {
                console.log('Downloaded as', downloadResult);
                page++;
                return getPhotos(page)
                  .then(function (newPhotos) {
                    photos = newPhotos;
                  });
              });
          })
          .finally(function () {
            console.log('done');
          });
      });
  });
});