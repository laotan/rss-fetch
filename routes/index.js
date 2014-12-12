var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Feeds = mongoose.model('Feeds');
var Posts = mongoose.model('Posts');

var AUTH_KEY = "YourAdminKey";

var pagination = require('pagination');

var siteMenus = [
    {
        "title": "Recently Posts",
        "url": "/"
    },
    {
        "title": "All Posts",
        "url": "/posts"
    },
    {
        "title": "All Feeds",
        "url": "/feeds"
    }
];

/* GET home page. */
router.get('/', function (req, res) {

    //每天0点自动抓，显示前一天0点以后的文章
    var d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0);

    Posts.find({postTime: {$gte: d}}, 'title url postTime feedId', {sort: '-postTime'})
        .populate('feedId')
        .exec(function (err, posts) {
            if (err) return res.send(500, {
                error: err
            });
            if (req.param("json")) {
                return res.send(posts);
            } else {
                return res.render('index', {
                    title: 'Recently Feeds',
                    menus: siteMenus,
                    activeMenu: 0,
                    posts: posts
                });
            }
        });
});

router.get('/posts', function(req, res){
    res.redirect('/posts/page/1');
});
/* GET all post page. */
router.get('/posts/page/:page', function (req, res) {
    var perPage = 10,
        page = req.param('page') > 1 ? req.param('page') - 1 : 0;

    Posts.find({}, 'title url postTime feedId', {limit: perPage, skip: page * perPage, sort: '-postTime'})
        .populate('feedId')
        .exec(function (err, posts) {
            if (err) return res.send(500, {
                error: err
            });
            return Posts.count().exec(function (e, count) {
                if (req.param("callback")) {
                    return res.jsonp(posts);
                } else {

                    var ukPaginator = new pagination.TemplatePaginator({
                        prelink: '/posts/',
                        current: page + 1,
                        rowsPerPage: perPage,
                        totalResult: count,
                        slashSeparator: true,
                        template: function(result) {
                            var i, len, prelink;
                            var html = '<ul class="uk-pagination">';
                            if(result.pageCount < 2) {
                                return "";
                            }
                            prelink = this.preparePreLink(result.prelink);
                            if(result.previous) {
                                html += '<li><a href="' + prelink + result.previous + '"><i class="uk-icon-angle-double-left"></i></a></li>';
                            }
                            if(result.range.length) {
                                var len = result.range.length;
                                if(result.range[0] > 2){
                                    html += '<li><a href="' + prelink + result.first + '">' + result.first + '</a></li>';
                                    html += '<li><span>...</span></li>';
                                }
                                for( i = 0, len; i < len; i++) {
                                    if(result.range[i] === result.current) {
                                        html += '<li class="uk-active"><span>' + result.range[i] + '</span></li>';
                                    } else {
                                        html += '<li><a href="' + prelink + result.range[i] + '">' + result.range[i] + '</a></li>';
                                    }
                                }
                                if(result.range[0] + 5 < result.last ){
                                    html += '<li><span>...</span></li>';
                                    html += '<li><a href="' + prelink + result.last + '">' + result.last + '</a></li>';
                                }
                            }
                            if(result.next) {
                                html += '<li><a href="' + prelink + result.next + '"><i class="uk-icon-angle-double-right"></i></a></li>';
                            }
                            html += '</ul>';
                            return html;
                        }
                    });
                    return res.render('index', {
                        title: 'All Posts',
                        menus: siteMenus,
                        activeMenu: 1,
                        posts: posts,
                        pager: ukPaginator.render()
                    });
                }
            });
        });
});

router.get('/post/:id', function (req, res) {
    var postId = req.param('id');
    Posts.findById(postId, function (err, post) {
        if (err) {
            return res.send(500, {
                error: err
            });
        } else if (req.param("callback")) {
            return res.jsonp(post);
        } else {
            res.send(500, {error: "不能直接访问"})
        }
    });
});

/* GET feeds add  page. */
router.get('/feeds', function (req, res) {

    var auth = false;
    if (req.cookies.auth == AUTH_KEY) {
        auth = true;
    } else {
        if (req.param('auth') == AUTH_KEY) {
            res.cookie('auth', AUTH_KEY, {httpOnly: true});
            auth = true;
        }
    }

    Feeds.find(function (err, feeds) {
        if (err) return res.send(500, {
            error: err
        });

        if (req.param("callback")) {
            return res.jsonp(feeds);
        } else {
            return res.render('feeds', {
                title: 'All Feeds',
                menus: siteMenus,
                activeMenu: 2,
                auth: auth,
                feeds: feeds
            });
        }
    });

});

/* post feeds add page */
router.post('/new', function (req, res) {
    // require feed parser and http
    var FeedParser = require('feedparser');
    var http = require('http');
    var feedUrl = req.body.feedUrl;

    if (req.cookies.auth == AUTH_KEY) {
        http.get(feedUrl, function (respond) {
            respond.pipe(new FeedParser({}))
                .on('error', function (error) {
                    return res.send(500, {
                        error: error.message
                    });
                })
                .on('meta', function (meta) {
                    // Store the metadata for later use
                    new Feeds({
                        title: meta.title,
                        url: meta.link,
                        feedUrl: feedUrl
                    }).save(function (err, feeds, count) {
                            res.redirect('/feeds');
                        });
                })
        });
    } else {
        res.send(500, {
            error: "没有权限"
        });
    }

});


router.get('/del/:id', function (req, res) {

    if (req.cookies.auth == AUTH_KEY) {
        var id = req.param('id');
        Feeds.findByIdAndRemove(id, function (err) {
            if (err) {
                res.send(500, {error: err});
            } else {
                res.redirect('/feeds');
            }
        });
    } else {
        res.send(500, {
            error: "没有权限"
        });
    }


});

module.exports = router;
