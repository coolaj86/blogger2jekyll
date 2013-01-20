/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var connect = require('connect')
    , fs = require('fs')
    , path = require('path')
    ;

  function defaultPermalinkify(oldUrl) {
    // get everything except the domain
    return oldUrl.replace(/https?:\/\/[^\/]*/, '');
  }

  function otherPermalinkify(oldUrl) {
    // get nothing except the filename
    return oldUrl.split('/').pop()
  }

  function createServer(pub, servepath, opts) {
    opts = opts || {};
    var server
      , permalinkify = opts.permalinkify || defaultPermalinkify
      ;
      
    servepath = '/' + (servepath || '').replace(/[\/\\]/g, '');

    server = connect.createServer()
      .use(connect.query())
      .use(function (request, response, next) {
          console.log('fixRedir', request.url);

          function fixRedirectPost() {
            // Permament Redirect
            response.statusCode = 301;
            response.setHeader(
                'Location'
              , path.normalize(servepath + '/' + permalinkify(request.query.blogger))
            );
            response.end();
          }

          if (request.query.blogger) {
            fixRedirectPost();
            return;
          }

          function fixDoubleDash() {
            // Permament Redirect
            response.statusCode = 301;
            response.setHeader('Location', request.url.replace(/-+/g, '-'));
            response.end();
          }

          if (/--/.test(request.url)) {
            fixDoubleDash();
            return;
          }

          next();
        })
      // fuzzy redirect
      .use(path.normalize('/' + servepath), function (request, response, next) {
          console.log('fuzzyRedir', request.url);
          var url = request.url.split('/').pop()
            ;

          function sanatize(str) {
            return str
              .replace(/\.\w+$/, '')     // remove .html
              .replace(/%[\dA-Z]+/g, '') // remove %20
              .replace(/\ban?\b/g, '')   // ignore a/an
              .replace(/\bthe\b/g, '')   // ignore the
              .replace(/\bof\b/g, '')    // ignore of
              .replace(/[^a-z0-9]/g, '') // remove non-alphanumerics
              ;
          }

          function alphabetSoup(str) {
            var shorter = sanatize(str)
              , longer = sanatize(url.split('/').pop())
              , len = Math.min(25, shorter.length, longer.length) - 1
              ;

            if (str === url) {
              // just in case connect.static() is being loaded late
              return;
            }

            if (shorter.substr(0, len) !== longer.substr(0, len)) {
              // console.log(shorter, longer);
              return;
            }

            response.statusCode = 301;
            response.setHeader('Location', path.normalize(servepath + '/' + str));
            response.end();
            return true;
          }

          function fuzzy301(err, nodes) {
            if (err) { next(); return; }
            if (!nodes.some(alphabetSoup)) {
              next();
            }
          }
          // joining /rootdir, /sub/dir/ -> /rootdir/sub/dir/
          fs.readdir(path.join(pub, servepath.replace(/[\/\\]/g, '/')), fuzzy301);
        })
      ;
    return server;
  }

  module.exports = createServer;
}());
