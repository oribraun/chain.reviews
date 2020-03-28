var CoinMarketCap = require('../models/coin_market_cap');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    CoinMarketCap[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, coinMarket) {
        if(coinMarket) {
            return cb(coinMarket);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    CoinMarketCap[db.getCurrentConnection()].findOne({symbol: obj.symbol}, function(err, coinMarketCap) {
        if(err) {
            return cb(err);
        }
        if(coinMarketCap) { // exist
            // coinMarketCap.symbol = obj.symbol,
            coinMarketCap.priceChange = obj.priceChange,
            coinMarketCap.priceChangePercent = obj.priceChangePercent,
            coinMarketCap.prevClosePrice = obj.prevClosePrice,
            coinMarketCap.lastPrice = obj.lastPrice,
            coinMarketCap.bidPrice = obj.bidPrice,
            coinMarketCap.askPrice = obj.askPrice,
            coinMarketCap.openPrice = obj.openPrice,
            coinMarketCap.highPrice = obj.highPrice,
            coinMarketCap.lowPrice = obj.lowPrice,
            coinMarketCap.volume = obj.volume,
            coinMarketCap.quoteVolume = obj.quoteVolume,
            coinMarketCap.openTime = obj.openTime,
            coinMarketCap.closeTime = obj.closeTime,
            coinMarketCap.firstId = obj.firstId,   // First tradeId
            coinMarketCap.lastId = obj.lastId,    // Last tradeId
            coinMarketCap.count = obj.count         // Trade count
            coinMarketCap.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            var newCoinMarketCap = new CoinMarketCap[db.getCurrentConnection()]({
                symbol: obj.symbol,
                priceChange: obj.priceChange,
                priceChangePercent: obj.priceChangePercent,
                prevClosePrice: obj.prevClosePrice,
                lastPrice: obj.lastPrice,
                bidPrice: obj.bidPrice,
                askPrice: obj.askPrice,
                openPrice: obj.openPrice,
                highPrice: obj.highPrice,
                lowPrice: obj.lowPrice,
                volume: obj.volume,
                quoteVolume: obj.quoteVolume,
                openTime: obj.openTime,
                closeTime: obj.closeTime,
                firstId: obj.firstId,   // First tradeId
                lastId: obj.lastId,    // Last tradeId
                count: obj.count         // Trade count
            });

            newCoinMarketCap.save(function(err) {
                if (err) {
                    console.log(err);
                    return cb();
                } else {
                    // console.log("initial stats entry created");
                    //console.log(newStats);
                    return cb();
                }
            });
        }
    });
}

function getOne(symbol, cb) {
    CoinMarketCap[db.getCurrentConnection()].findOne({symbol: symbol}, function(err, coinMarket) {
        if(coinMarket) {
            return cb(coinMarket);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(symbol, cb) {
    CoinMarketCap[db.getCurrentConnection()].deleteOne({symbol: symbol}, function(err, coinMarket) {
        if(coinMarket) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    CoinMarketCap[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function update(symbol, options, cb) {
    CoinMarketCap[db.getCurrentConnection()].updateOne({symbol: symbol}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    CoinMarketCap[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    CoinMarketCap[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.update = update;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;
