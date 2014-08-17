var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Feeds = mongoose.model('Feeds');
var Posts     = mongoose.model( 'Posts' );
var AUTH_KEY = "YourAdminKey";

var siteMenus = [
    {
        "title": "Recently Posts",
        "url": "/"
    },
    {
        "title": "All Posts",
        "url": "/posts/1"
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

    Posts.find({postTime: { $gte: d}},'title url postTime',{sort:'-postTime'},function (err, posts) {
        if (err) return res.send(500, {
            error: err
        });
        if(req.param("json")){
            return res.send(posts);
        }else{
            return res.render('index', {
                title: 'Recently Feeds',
                menus: siteMenus,
                activeMenu: 0,
                posts: posts
            });
        }

    });
});

/* GET all post page. */
router.get('/posts/:page', function (req, res) {
    var perPage = 10,
        page = req.param('page') > 1 ? req.param('page') - 1 : 0;

    Posts.find({},'title url postTime',{limit:perPage,skip:page*perPage,sort:'-postTime'},function (err, posts) {
        if (err) return res.send(500, {
            error: err
        });
        return Posts.count().exec(function (e, count) {
            return res.render('index', {
                title: 'All Posts',
                menus: siteMenus,
                activeMenu: 1,
                posts: posts,
                page: page + 1,
                pages:count / perPage
            });
        });
    });
});


/* GET feeds add  page. */
router.get('/feeds', function (req, res) {

    var auth= false;
    if(req.cookies.auth == AUTH_KEY){
        auth = true;
    } else{
        if(req.param('auth') == AUTH_KEY){
            res.cookie('auth', AUTH_KEY, {httpOnly: true });
            auth = true;
        }
    }

    Feeds.find(function (err, feeds) {
        if (err) return res.send(500, {
            error: err
        });
        return res.render('feeds', {
            title: 'All Feeds',
            menus: siteMenus,
            activeMenu: 2,
            auth:auth,
            feeds: feeds
        });
    });

});

/* post feeds add page */
router.post('/new', function(req, res) {
    // require feed parser and http
    var FeedParser = require('feedparser');
    var http = require('http');
    var feedUrl =   req.body.feedUrl;

    if(req.cookies.auth == AUTH_KEY){
        http.get(feedUrl, function(respond) {
            respond.pipe(new FeedParser({}))
                .on('error', function(error){
                    return res.send(500, {
                        error: error.message
                    });
                })
                .on('meta', function(meta){
                    // Store the metadata for later use
                    new Feeds({
                        title    : meta.title,
                        url      : meta.link,
                        feedUrl  : feedUrl
                    }).save( function( err, feeds, count ){
                            res.redirect( '/feeds' );
                        });
                })
        });
    }else{
        res.send(500, {
            error: "没有权限"
        });
    }

});



router.get('/del/:id', function (req, res) {

    if(req.cookies.auth == AUTH_KEY){
        var id= req.param('id');
        Feeds.findByIdAndRemove(id, function (err) {
            if (err){
                res.send(500, {error: err});
            } else{
                res.redirect( '/feeds' );
            }
        });
    } else{
        res.send(500, {
            error: "没有权限"
        });
    }


});

module.exports = router;