// var express = require('express');
// var session = require('express-session');
// var cors = require('cors');
// var fs = require('fs-extra');
// const execFile = require('child_process').execFile;
const spawn = require('child_process').spawn;
const wallet_commands = require('./wallet_commands');
// const exec = require('child_process').exec;
// var app = express();
// var http = require('http').createServer(app);
// // var io = require('socket.io')(http);
// var CronJob = require('cron').CronJob;
// var isWin = process.platform === "win32";
// var port = process.env.PORT || 4000;

// app.set('trust proxy', 1);
// app.use(session({
//     secret: 'keyboard cat',
//     resave: false,
//     saveUninitialized: false ,
//     cookie: { secure: false, maxAge: 1000*60*60*24 }
// }))
// app.use(cors());
// http.listen(port, function() {
//     console.log('Server Works !!! At port ' + port);
// });


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

wallet_commands.getAllMasternodes('fix-cli').then(function(masternodes) {
    console.log('masternodes', masternodes);
}).catch(function(err) {
    console.log('error getting masternodes', err);
})


