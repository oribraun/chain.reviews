var TxByDay = require('../models/txByDay');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    TxByDay[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, peers) {
        if(peers) {
            return cb(peers);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    TxByDay[db.getCurrentConnection()].findOne({d: obj.date}, function(err, txByDay) {
        if(err) {
            return cb(err);
        }
        if(txByDay) { // exist
            txByDay.w = obj.week;
            txByDay.c = obj.count;
            txByDay.t = obj.totalAmountADay;
            txByDay.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            // console.log('obj.date', obj.date)
            var newTxByDay = new TxByDay[db.getCurrentConnection()]({
                d: obj.date,
                date: obj.date,
                w: obj.week,
                c: obj.count,
                t: obj.totalAmountADay,
            });

            newTxByDay.save(function(err) {
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

function getOne(date, cb) {
    TxByDay[db.getCurrentConnection()].findOne({d: date}, function(err, peer) {
        if(peer) {
            return cb(peer);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(date, cb) {
    TxByDay[db.getCurrentConnection()].deleteOne({d: date}, function(err, peer) {
        if(peer) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    TxByDay[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function update(date, options, cb) {
    TxByDay[db.getCurrentConnection()].updateOne({d: date}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    TxByDay[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    TxByDay[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getAllForChart(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    TxByDay[db.getCurrentConnection()].find({},{_id:0,d:1,t:1,c:1,w:1}).sort(sort).limit(limit).exec( function(err, peers) {
        if(peers) {
            return cb(peers);
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
module.exports.getAllForChart = getAllForChart;
