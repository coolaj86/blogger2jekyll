#!/usr/bin/env node
/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var connect = require('connect')
    , app = require('../lib/server')
    , port = process.argv[2] || 3000
    , directory = process.argv[3] || 'blogger-posts'
    , server
    ;

  app.use(connect.static(directory));
  app.use(connect.directory(directory));
  server = app.listen(port, function () {
    console.log('Serving ' + directory + ' on http://localhost:' + port);
  });
}());
