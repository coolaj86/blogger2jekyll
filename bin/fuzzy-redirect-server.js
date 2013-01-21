#!/usr/bin/env node
/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var connect = require('connect')
    , b2j = require('../lib/server')
    , app = connect.createServer()
    , port = process.argv[2] || 3000
    , directory = process.argv[3] || '.'
    , subdir = process.argv[4] || ''
    , server
    ;
    
  app.use(connect.favicon());
  app.use(connect.static(directory));
  app.use(connect.directory(directory));

  // it's important that your app have connect.query() in the stack before b2j
  app.use(connect.query());
  app.use(b2j(directory, subdir));
  server = app.listen(port, function () {
    console.log(directory, subdir);
    console.log('Serving ' + directory + ' on http://localhost:' + port);
  });
}());
