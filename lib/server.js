/*jshint strict:true node:true es5:true onevar:true laxcomma:true
laxbreak:true eqeqeq:true immed:true latedef:true undef:true unused:true */
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

  function createServer(pub, servepath, opts) {
    opts = opts || {};
    var server
      , permalinkify
      ;

    function fuzzyRedirect(request, response, next) {
      //console.log('fuzzyRedir', request.url);
      var pathPart = request.url.split('/')
        , requestedFile = request.url.split('/').pop()
        , realDirPath
        ;

      pathPart.pop();
      pathPart = pathPart.join('/');

      //console.log('pathPart', pathPart);
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

      function alphabetSoup(existingFile) {
        var shorter = sanatize(existingFile)
          , longer = sanatize(requestedFile.split('/').pop())
          , len = Math.min(25, shorter.length, longer.length) - 1
          ;

        if (existingFile === requestedFile) {
          // just in case connect.static() is being loaded late
          return;
        }

        if (shorter.substr(0, len) !== longer.substr(0, len)) {
          // console.log(shorter, longer);
          return;
        }

        response.statusCode = 301;
        response.setHeader(
            'Location'
          , path.normalize(servepath + '/' + pathPart + '/' + existingFile)
        );
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
      realDirPath = path.join(pub, servepath.replace(/[\/\\]/g, '/'), pathPart);

      //console.log('searchdir', realDirPath);
      fs.readdir(
          realDirPath
        , fuzzy301
      );
    }

    function solidRedirect(request, response, next) {
      //console.log('fixRedir', request.url);

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
    }

    permalinkify = opts.permalinkify || defaultPermalinkify;
    servepath = '/' + (servepath || '').replace(/[\/\\]/g, '');

    server = connect.createServer()
      .use(connect.query())
      .use(solidRedirect)
      // fuzzy redirect
      .use(path.normalize('/' + servepath), fuzzyRedirect)
      ;

    return server;
  }

  module.exports = createServer;
}());
