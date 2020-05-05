var ClusterTxByDay = require('../models/clusterTxByDay');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    ClusterTxByDay[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, peers) {
        if(peers) {
            return cb(peers);
        } else {
            return cb(null);
        }
    });
}

function getAllForCluster(cid, sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    ClusterTxByDay[db.getCurrentConnection()].find({cid: cid}).sort(sort).limit(limit).exec( function(err, txs) {
        if(txs) {
            return cb(txs);
        } else {
            console.log('err', err)
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    ClusterTxByDay[db.getCurrentConnection()].findOne({cid: obj.cid, d: obj.date}, function(err, txByDay) {
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
            var newTxByDay = new ClusterTxByDay[db.getCurrentConnection()]({
                cid: obj.cid,
                d: obj.date,
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

function getOne(cid, date, cb) {
    ClusterTxByDay[db.getCurrentConnection()].findOne({cid: obj.cid, d: date}, function(err, peer) {
        if(peer) {
            return cb(peer);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(cid, date, cb) {
    ClusterTxByDay[db.getCurrentConnection()].deleteOne({cid: obj.cid, d: date}, function(err, peer) {
        if(peer) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    ClusterTxByDay[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function update(cid, date, options, cb) {
    ClusterTxByDay[db.getCurrentConnection()].updateOne({cid: obj.cid, d: date}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    ClusterTxByDay[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    ClusterTxByDay[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function getAllForChart(cid, sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    ClusterTxByDay[db.getCurrentConnection()].find({cid: cid},{_id:0,d:1,t:1,c:1,w:1}).sort(sort).limit(limit).exec( function(err, peers) {
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
module.exports.getAllForCluster = getAllForCluster;
