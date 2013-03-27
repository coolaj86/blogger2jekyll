/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var xml2js = require('xml2js')
    , path = require('path')
    , parser = new xml2js.Parser()
    , posts = {}
    , postsArr = []
    , untitledCount = 0
    ;

  function defaultPermalinkify(link) {
    // get everything except the domain
    return link.$.href.replace(/https?:\/\/[^\/]*/, '');
  }

  function otherPermalinkify(link) {
    // get nothing except the filename
    return link.$.href.split('/').pop();
  }

  function parse(data, eachPost, opts) {
    opts = opts || {};
    var prefix = opts.prefix || ''
      , permalinkify = opts.permalinkify || defaultPermalinkify
      ;

    function templatePosts() {
      postsArr.forEach(function (post) {
        var contents
          , allSubcontents = ''
          , subcontents = []
          , yaml = []
          ;

        post.comments.forEach(function (comment) {
          subcontents.push(
              '<div class="css-full-comment js-full-comment">'
            , '  <div class="css-comment-user-link js-comment-user-link">'
            , '  <a href="' + comment.uri + '">'
            , '  <div class="css-comment-name js-comment-name">'
            , '    ' + (comment.name || 'anonymous')
            , '  </div>'
            , '  </a>'
            , '  <div class="css-comment-date js-comment-date">'
            , '    ' + comment.published.toISOString()
            , '  </div>'
            , '  </div>'
          );

          if (comment.title.substr(0, 10) !== comment.content.substr(0, 10)) {
            subcontents.push(
                '  <div class="css-comment-title js-comment-title">'
              , '    ' + comment.title
              , '  </div>'
            );
          }

          subcontents.push(
              '  <div class="css-comment-content js-comment-content">'
            , '    ' + comment.content
            , '  </div>'
            , '  <br/>'
            , '</div>'
          );
        });

        yaml = [
            'title: "' + post.title.replace(/"/g, '\\"') + '"'
          , 'layout: "' + post.postType + '"'
          , 'permalink: "' + path.normalize(prefix + '/' + post.permalink) + '"'
          , 'uuid: "' + post.uuid + '"'
          , 'guid: "' + post.guid + '"'
          , 'date: "' + post.published.toISOString().replace('T', ' ').replace(/\..+/g,'') + '"'
          ];

        if ( post.published != post.updated )
          yaml.push( 'updated: "' + post.updated.toISOString().replace('T', ' ').replace(/\..+/g,'') + '"' );

        yaml.push(
            'description: '
        );

        yaml.push(
            'blogger:'
          , '    siteid: "' + post.siteid + '"'
          , '    postid: "' + post.uuid + '"'
        );

        if (post.commentcount)
        	yaml.push( '    comments: "' + post.commentcount + '"' );

        if ( typeof post.category != 'undefined' )
        	yaml.push( 'categories: [' + post.category.join(', ') + ']' );
        else
        	yaml.push( 'categories: ' );

        yaml.push(
            'author: '
          , '    name: "' + post.authorname + '"'
          , '    url: "' + post.authoruri + '?rel=author"'
          , '    image: "' + post.authorimage + '"'
        );

        if (post.draft)
          yaml.push( 'published: "false"' );

        if (post.location) {
        	yaml.push( 'location:' );
        	if ( typeof post.locationName != 'undefined' )
        		yaml.push( '    name: "' + post.locationName + '"' );
        	yaml.push( '    latitude: "' + post.locationPoint[0] + '"' );
        	yaml.push( '    longitude: "' + post.locationPoint[1] + '"' );
        	if ( typeof post.locationBox != 'undefined' )
        		yaml.push( '    box: [' + post.locationBox.join(', ') + ']' );
        }
        	
        contents = ['---'];
        
        contents = contents.concat(yaml);

        contents.push(
            '---'
          , ''
          , '<div class="css-full-post-content js-full-post-content">'
          , post.content
          , '</div>'
        );
        
        if ( subcontents.length > 0 ) {
          contents.push(
          	  '<div class="css-full-comments-content js-full-comments-content">'
          	, subcontents.join('\n')
          	, '</div>'
          );
        }

        eachPost(post.permalink, contents.join('\n'));
      });
    }

    function translateFile(err, obj) {
      if (err) { throw err; }
      obj.feed.entry.forEach(function (entry) {
        var uuid
          , post = { comments: [] }
          , comment = {}
          ;

        function getUuid() {
          uuid = entry.id[0].split(':').pop().replace(/.*post-(.*)/, '$1');
        }

        function getBasics(obj) {
          obj.guid = entry.id[0];
          obj.published = new Date(entry.published[0]);
          obj.updated = new Date(entry.updated[0]);
          obj.title = entry.title[0]._;
          obj.content = entry.content[0]._;
          obj.commentcount = entry['thr:total'] || false;
          obj.authorname = entry.author[0].name;
          obj.authoruri = entry.author[0].uri;
          obj.authorimage = entry.author[0]['gd:image'][0].$['src'];
          obj.postType = 'post';
          obj.category = [];
          obj.siteid = entry.id[0].split(':').pop().replace(/blog-([0-9]+)\.post-.*/, '$1');
          obj.draft = ( typeof entry['app:control'] != 'undefined'  &&  typeof entry['app:control'][0] != 'undefined'  && entry['app:control'][0]['app:draft'] == 'yes' );
          
          if ( typeof entry['georss:point'] != 'undefined' ) {
          	obj.location = true;
          	obj.locationPoint = entry['georss:point'][0].split(' ');
          	if ( typeof entry['georss:featurename'] != 'undefined' )
          		obj.locationName = entry['georss:featurename'][0];
          	if ( typeof entry['georss:box'] != 'undefined' )
          		obj.locationBox = entry['georss:box'][0].split(' ');
          }

          if ( typeof entry['category'] != 'undefined' ) {
          	obj.category = [];
          	entry['category'].forEach(function (category) {
          		if ( category.$['scheme'] == 'http://www.blogger.com/atom/ns#' )
	          		obj.category.push( category.$['term'] );
          		if ( category.$['scheme'] == 'http://schemas.google.com/g/2005#kind' )
	          		obj.postType = category.$['term'].replace( 'http://schemas.google.com/blogger/2008/kind#', '' );
          	});
          	if ( obj.category.length == 0 )
          		delete obj.category;
          }

        }

        if (/kind#post/.test(entry.category[0].$.term)) {
          getUuid();
          getBasics(post);

          post.uuid = uuid;
          entry.link.forEach(function (link) {
            if ('alternate' === link.$.rel) {
              post.permalink = permalinkify(link);
            }
          });

          if (!post.permalink) {
            if (!post.title) {
              if (!post.content) {
                // console.log(entry);
                // empty unpublished draft post
              }
              post.title = 'untitled ' + untitledCount.toString();
              untitledCount += 1;
              // unpublished draft post
              return;
            }
            // permalink is optional
            post.permalink = post.title
              .replace(/\W/g, '-')
              .replace(/-+/g, '-')
              .replace(/-$/, '')
              + '.html'
              ;
          }

          if (!post.title) {
            post.title = (post.permalink).split('/').pop().replace(/\.[^\.]*$/g, '');
          }

          posts[uuid] = post;
          postsArr.push(post);
        }

        if (/kind#comment/.test(entry.category[0].$.term) && entry['thr:in-reply-to']) {
          getUuid();
          comment.uuid = uuid;
          uuid = entry['thr:in-reply-to'][0].$.ref.replace(/.*post-(.*)/, '$1');
          if (entry.author) {
            if (entry.author[0].name) {
              comment.name = entry.author[0].name[0];
            }
            if (entry.author[0].uri) {
              comment.uri = entry.author[0].uri[0];
            }
          }
          post = posts[uuid];
          post.comments.push(comment);
          getBasics(comment);
        }
      });

      templatePosts();
    }
    
    parser.parseString(data, translateFile);
  }

  module.exports.parse = parse;
}());
