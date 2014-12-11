var express = require('express');
var router = express.Router();

// require feed parser and http
var FeedParser = require('feedparser');
var http = require('http');
var mongoose = require('mongoose');
var Feeds = mongoose.model('Feeds');
var Posts = mongoose.model('Posts');

/* GET feed listing. */
router.get('/', function (req, res) {

    if (req.connection.remoteAddress == "127.0.0.1") {

        Feeds.find(function (err, feeds) {
            if (err) return res.send(500, {
                error: err
            });

            //前一天
            var d = new Date();
            d.setDate(d.getDate() - 1);

            // each feeds post
            feeds.forEach(function (items) {
                http.get(items.feedUrl, function (respond) {

                    respond.pipe(new FeedParser({}))
                        .on('error', function (error) {
                            console.log(error);
                        })
                        .on('readable', function () {
                            var stream = this, item;
                            while (item = stream.read()) {
                                // Each 'readable' event will contain 1 article
                                if (item.pubDate > d) {
                                    // save posts
                                    new Posts({
                                        title: item.title,
                                        url: item.link,
                                        desc: item.description,
                                        feedId: items._id,
                                        postTime: item.pubDate
                                    }).save(function(e){
                                            if (e) console.log(e);
                                        });
                                }
                            }
                        })
                });
            });
            return res.send("done！");
        });

    } else {
        res.send(500, {
            error: "禁止访问"
        });
    }
});

module.exports = router;
