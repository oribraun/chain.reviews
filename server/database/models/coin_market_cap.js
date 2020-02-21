var mongoose = require('mongoose')
    , Schema = mongoose.Schema;
var db = require('./../db');

var coinMarketCapSchema = new Schema({
    symbol: { type: String },
    priceChange: { type: String },
    priceChangePercent:{ type: String },
    lastPrice:{ type: String },
    bidPrice:{ type: String },
    askPrice:{ type: String },
    openPrice:{ type: String },
    highPrice:{ type: String },
    lowPrice:{ type: String },
    volume:{ type: String },
    quoteVolume:{ type: String },
    openTime:{ type: Number },
    closeTime:{ type: Number },
    firstId:{ type: Number },
    lastId:{ type: Number },
    count:{ type: Number }
});

var connections = db.getConnections();
var obj = {};
for(var i in connections) {
    obj[i] = connections[i].model('coinMarketCap', coinMarketCapSchema);
}

module.exports = obj;