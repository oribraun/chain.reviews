var Markets = require('../models/markets');
var CoinMarketCap = require('../models/coin_market_cap');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Markets[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, market) {
        if(market) {
            return cb(market);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    Markets[db.getCurrentConnection()].findOne({symbol: obj.symbol}, function(err, market) {
        if(err) {
            return cb(err);
        }
        if(market) {
            market.symbol = obj.symbol,
            market.summary = obj.summary,
            market.chartdata = obj.chartdata,
            market.bids = obj.bids,
            market.asks = obj.asks,
            market.history = obj.history
            market.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            var newMarket = new Markets[db.getCurrentConnection()]({
                symbol: obj.symbol,
                summary: obj.summary,
                chartdata: obj.chartdata,
                bids: obj.bids,
                asks: obj.asks,
                history: obj.history
            });

            newMarket.save(function(err) {
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
    Markets[db.getCurrentConnection()].findOne({symbol: symbol}, function(err, market) {
        if(market) {
            return cb(market);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(symbol, cb) {
    Markets[db.getCurrentConnection()].deleteOne({symbol: symbol}, function(err, market) {
        if(market) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Markets[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function update(symbol, options, cb) {
    Markets[db.getCurrentConnection()].updateOne({symbol: symbol}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    Markets[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    Markets[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getAllJoin(where, sortBy, order, limit, offset, cb) {
    var sort = {};
    sort[sortBy] = order == 'asc' ? 1 : -1;
    var aggregate = [];
    aggregate.push({$match:where})
    aggregate.push({$sort:sort})
    aggregate.push({$skip:offset})
    if(limit) {
        aggregate.push({$limit: limit})
    }
    aggregate.push({
        "$project": {
            "symbol": 1,
            "summary": 1,
            "chartdata": { "$ifNull" : [ "$chartdata", [ ] ] },
            "bids": { "$ifNull" : [ "$bids", [ ] ] },
            "asks": { "$ifNull" : [ "$asks", [ ] ] },
            "history": { "$ifNull" : [ "$history", [ ] ] },
        }
    },)
    aggregate.push({
        "$lookup": {
            "from": CoinMarketCap[db.getCurrentConnection()].collection.name,
            "localField": "symbol",
            "foreignField": "symbol",
            // "pipeline":[
            // {"$unwind":"$vout"},
            // {"$match":{"$expr":{"$eq":["$$vin.vout","$vout.n"]}}}
            // ],
            "as": "market_cap"
            // where vin.vout = vout[0].n
        }
    })
    aggregate.push({
        "$unwind": {
            "path": "$market_cap",
            "preserveNullAndEmptyArrays": true
        }
    })
    Markets[db.getCurrentConnection()].aggregate(aggregate).allowDiskUse(true).exec(function(err, markets) {
        if(markets) {
            return cb(markets);
        } else {
            return cb(null);
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
module.exports.getAllJoin = getAllJoin;
