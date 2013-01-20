# Blogger2Jekyll

This tool will help you migrate from Blogger / Blogspot to any
static site generator that uses YAML front-matter such as
Jekyll / Octopress / Ruhoh / Nanoc.

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
        blogger2jekyll /path/to/blog-dd-mm-yyyy.xml /path/to/converted-blogger-posts
        blogger2jekyll-server /path/to/converted-blogger-posts

`blogger2jekyll` reads in posts and comments from the xml file
(defaults to fuzzy searcing in the current directory for `blog-*.xml`)
and outputs them to the specified output folder (defaults to `blogger-posts`)

`blogger2jekyll-server` issues fuzzy redirects if it can find a name similar to
the one it was searching for in the directory it expected to find it in.

For Example

    GET /normal.html -> /normal.html
    GET /title-of-blog-may-be.html -> /title-of-blog-may-be-truncated.html
    GET /fun-with-osx-10-8.html -> /fun-with-osx-108.html
    GET /this-post-really-doesnt-exist -> 404'd!

## Advanced Usage

Open up the converter and modify it to meet your needs.
It's very few lines of code and very straight forward.

    git clone git://github.com/coolaj86/blogger2jekyll.git
    cd blogger2jekyll
    find .
    vim lib/index.js
