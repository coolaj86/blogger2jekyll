#!/usr/bin/env node
/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var fs = require('fs')
    , mkdirp = require('mkdirp')
    , path = require ('path')
    , b2j = require('../lib')
    , file = process.argv[2]
    , folder = process.argv[3] || 'blogger-posts'
    , nodes
    ;

  if (!file) {
    fs.readdirSync(process.cwd()).forEach(function (node) {
      if (/^blog-.*\.xml$/.test(node)) {
        file = node;
      }
    });
  }

  if (!file) {
    console.error("Couldn't find a file like blog-dd-mm-yyyy.xml in the current directory. Please specify one instead");
    return;
  }

  function eachPost(relpath, contents) {
    var filename = relpath.split('/').pop()
      ;

    var date=new RegExp(/date\:\s\"([0-9]{4}-[0-9]{2}-[0-9]{2})/)
      ;

    if ( date.test(contents) && ( contents.indexOf('published: "false"') == -1 ) ) {
    	filename = date.exec(contents)[1] + '-' + filename;
    } else {
	    filename = 'DRAFT' + '-' + filename;
    }
    
    // write the files out flat, the static compiler with write out the folders
    fs.writeFileSync(path.join(folder, filename), contents, 'utf8');
  }

  function parseFile(err, data) {
    b2j.parse(data, eachPost, { prefix: '' });
  }
  
  function readFile(err) {
    if (err) { throw err; }
    fs.readFile(file, 'utf8', parseFile);
  }

  function writeFiles() {
    mkdirp(folder, readFile);
  }

  writeFiles();
}());
