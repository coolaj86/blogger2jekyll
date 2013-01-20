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

        contents = [
            '---'
          , 'uuid: "' + post.uuid + '"'
          , 'title: "' + post.title.replace(/"/g, '\\"') + '"'
          , 'date: "' + post.published.toISOString().replace(/[ T].*/, '') + '"'
          , 'permalink: "' + path.normalize(prefix + '/' + post.permalink) + '"'
          , 'description: '
          , 'categories: '
          , '---'
          , ''
          , '<div class="css-full-post-content js-full-post-content">'
          , post.content
          , '</div>'
          , '<div class="css-full-comments-content js-full-comments-content">'
          , subcontents.join('\n')
          , '</div>'
        ];

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
          obj.published = new Date(entry.published[0]);
          obj.updated = new Date(entry.updated[0]._);
          obj.title = entry.title[0]._;
          obj.content = entry.content[0]._;
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
            post.permalink = '';
          }

          if (!post.title) {
            post.title = (post.permalink).split('/').pop().replace(/\.[^\.]*$/g, '');
          }

          posts[uuid] = post;
          postsArr.push(post);
        }

        if (/kind#comment/.test(entry.category[0].$.term)) {
          getUuid();
          comment.uuid = uuid;
          uuid = entry['thr:in-reply-to'][0].$.ref.replace(/.*post-(.*)/, '$1');
          comment.name = entry.author[0].name[0];
          comment.uri = entry.author[0].uri[0];
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
