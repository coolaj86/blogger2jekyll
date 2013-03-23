# Blogger2Jekyll

This tool will help you migrate from Blogger / Blogspot to any
static site generator that uses YAML front-matter such as
Jekyll / Octopress / Ruhoh / Nanoc.

[migrate]: http://blog.coolaj86.com/articles/migrate-from-blogger-to-ruhoh-with-proper-redirects.html

Also see [How to migrate from blogger to jekyll / ruhoh / octopress with proper redirects][migrate]

## Basic usage

Export your blog

  0. Login to Blogger
  1. Go to your blog's settings
  2. Go to Templates
  3. Change your template style to "classic" (temporarily) (it will keep your customizations saved)
  4. Go to Settings, Other
  5. Export your blog
  6. Change your template style back to the new one

Run `blogger2jekyll` on your downloaded export

0. Install [NodeJS](http://nodejs.org)

1. Follow the following:

        npm install -g blogger2jekyll
        blogger2jekyll /path/to/blog-dd-mm-yyyy.xml /path/to/posts
        mv /path/to/posts/ /path/to/pub/posts/
        blogger2jekyll-server 8080 /path/to/pub/ /path/to/pub/posts/

Might also be like this

        npm install -g blogger2jekyll
        blogger2jekyll ~/Downloads/blog-16-06-2004.xml /tmp/public/posts/
        ls /tmp/public/posts/
        blogger2jekyll-server 3000 /tmp/public/ posts

`blogger2jekyll` reads in posts and comments from the xml file
(defaults to fuzzy searcing in the current directory for `blog-*.xml`)
and outputs them to the specified output folder (defaults to `blogger-posts`)

If you don't care about handling blogger redirects properly, and your static site generator supports the `permalink` front-matter directive, you're done.

Just to be sure, check <with http://validator.w3.org/checklink>

However, if you're going to handle proper 301 redirects and or your static generator
does not handle the permalink directive, you'll probably wanna glance over the code
in `blogger2jekyll-server` (or even use it directly), which
uses fuzzy redirects if it can find a name similar to
the one it was searching for in the directory it expected to find it in.

For Example (if the posts directory is simply `p`)

    GET /p/normal.html -> /p/normal.html
    GET /p/title-of-blog-may-be.html -> /p/title-of-blog-may-be-truncated.html
    GET /p/fun-with-osx-10-8.html -> /p/fun-with-osx-108.html
    GET /p/this-post-really-doesnt-exist -> 404'd!

## Advanced Usage

Open up the converter and modify it to meet your needs.
It's very few lines of code and very straight forward.

    git clone git://github.com/coolaj86/blogger2jekyll.git
    cd blogger2jekyll
    find .
    vim lib/index.js
