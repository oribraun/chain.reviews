var express = require('express');
var session = require('express-session');
var cors = require('cors');
var ejs = require('ejs');
var bodyParser = require("body-parser");
// var fs = require('fs-extra');
// const execFile = require('child_process').execFile;
const spawn = require('child_process').spawn;
const wallet_commands = require('./wallet_commands');
// const exec = require('child_process').exec;
var app = express();
var http = require('http').createServer(app);
// // var io = require('socket.io')(http);
// var updateDbCron = require('./cronJobs/update_db');
// var isWin = process.platform === "win32";
var port = process.env.PORT || 3000;

const db = require('./database/db');
const settings = require('./wallets/all_settings');

db.multipleConnect(settings);
db.setCurrentConnection('fix');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.engine("html", ejs.renderFile);
app.use("/exp",express.static(__dirname + "/../explorer/dist"));
// app.set('view engine', 'ejs');

const routes = require('./routes');

process.on('SIGINT', function() {
    // console.log("Caught interrupt signal");
    db.multipleDisconnect();
    process.exit();
});

app.set('trust proxy', 1);
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false ,
    cookie: { secure: false, maxAge: 1000*60*60*24 }
}))

app.use(cors());
http.listen(port, function() {
    console.log('Server Works !!! At port ' + port);
});

// var wallet = process.argv[2];
//
// if(settings[wallet]) {
//     db.connect(settings[wallet].dbSettings);
// } else {
//     console.log('no database found');
// }
//
// process.on('SIGINT', function() {
//     // console.log("Caught interrupt signal");
//     db.disconnect();
//     process.exit();
// });
var addToHeader = function (req, res, next) {
    // res.header('Content-Type', 'application/json');
    // console.log("add to header called ... " + req.url + " origin - " + req.headers.origin);
    // // res.header("charset", "utf-8")
    // var allowedOrigins = ["http://localhost:3000", "http://52.0.84.174:3000", "http://52.0.84.174:8080", "http://cp.fitracks.net", "http://controlpanel.aetrex.com", "http://52.70.32.87", "http://54.174.118.86"];
    // var origin = req.headers.origin;
    // res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    // if(allowedOrigins.indexOf(origin) > -1){
    //     res.header("Access-Control-Allow-Origin", origin);
    // }
    // res.header("Access-Control-Allow-Credentials", true);
    // res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    // res.header("Content-Type", "application/json");
    next();
};

app.use('/', addToHeader, routes);


// wallet_commands.getBlockHash('fix-cli', 0).then(function(blockHash){
//     console.log('blockHash', blockHash);
// }).catch(function(err) {
//     console.log('error getting blockHash', err);
// });
// wallet_commands.getBlockCount('fix-cli').then(function(blockCount){
//     console.log('blockCount', blockCount);
// }).catch(function(err) {
//     console.log('error getting blockCount', err);
// });
// wallet_commands.getAllBlocks('fix-cli',function(index, hash){
//     console.log('hash-' + index, hash);
// }).then(function(time){
//     console.log('finish getting blocks', time);
// }).catch(function(err) {
//     console.log('error getting blocks', err);
// })

wallet_commands.getBlockHash('fix', 0).then(function(masternodes) {
    console.log('masternodes', masternodes);
}).catch(function(err) {
    console.log('error getting masternodes', err);
})


