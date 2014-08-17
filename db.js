/**
 * Created by laotan on 14-7-27.
 */
var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var Feeds = new Schema({
    id    : Number,
    title    : String,
    url    : String,
    feedUrl    : String,
    createTime : {type:Date,default:Date.now}
});

var Posts = new Schema({
    id    : Number,
    title : String,
    url   : String,
    desc  : String,
    feedId: Number,
    postTime : Date
});

mongoose.model( 'Feeds', Feeds );
mongoose.model( 'Posts', Posts );
mongoose.connect( 'mongodb://localhost/test' );