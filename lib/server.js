/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var connect = require('connect')
    , fs = require('fs')
    , path = require('path')
    ;

  function createServer(pub, servepath) {
    var server
      ;
    servepath = '/' + (servepath || 'articles').replace(/[\/\\]/g, '');

    server = connect.createServer()
      .use(connect.query())
      .use(function (request, response, next) {
          console.log('fixRedir', request.url);

          function fixRedirectPost() {
            // Permament Redirect
            response.statusCode = 301;
            response.setHeader(
                'Location'
              , path.normalize(servepath + '/' + request.query.blogger.split('/').pop())
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
              .replace(/\.\w+$/, '')
              .replace(/-a-/g, '')
              .replace(/-the-/g, '')
              .replace(/-of-/g, '')
              .replace(/%[\dA-Z]+/g, '')
              .replace(/[^a-z0-9]/g, '')
              ;
          }

          function alphabetSoup(str) {
            var shorter = sanatize(str)
              , longer = sanatize(url)
              ;

            if (str === url) {
              // just in case connect.static() is being loaded late
              return;
            }

            if (shorter.substr(0, 25) !== longer.substr(0, 25)) {
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
          fs.readdir(path.join(pub, servepath.replace(/\/\\/g, '')), fuzzy301);
        })
      ;
    return server;
  }

  module.exports = createServer;
}());
