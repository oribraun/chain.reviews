const express = require('express');
const app = express();
const api = require('./api');

app.get('/', function(req, res) {
    res.send('nodejs server is working')
});

app.use("/api", api);

module.exports = app;