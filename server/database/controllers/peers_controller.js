var Peers = require('../models/peers');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Peers[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    Peers[db.getCurrentConnection()].findOne({address: obj.address}, function(err, peer) {
        if(err) {
            return cb(err);
        }
        if(peer) { // exist
            peer.address = obj.address;
            peer.protocol = obj.protocol;
            peer.version = obj.version;
            peer.country = obj.country;
            peer.lastactivity = obj.lastactivity;
            peer.connectiontime = obj.connectiontime;
                peer.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else { // create new
            // console.log('new')
            var newPeers = new Peers[db.getCurrentConnection()]({
                address: obj.address,
                protocol: obj.protocol,
                version: obj.version,
                country: obj.country,
                lastactivity: obj.lastactivity,
                connectiontime: obj.connectiontime,
            });

            newPeers.save(function(err) {
                if (err) {
                    console.log(err);
                    return cb();
                } else {
                    console.log("initial stats entry created");
                    //console.log(newStats);
                    return cb();
                }
            });
        }
    });
}

function getOne(address, cb) {
    Peers[db.getCurrentConnection()].findOne({address: address}, function(err, stats) {
        if(stats) {
            return cb(stats);
        } else {
            return cb(null);
        }
    });
}

function deleteOne(address, cb) {
    Peers[db.getCurrentConnection()].deleteOne({address: address}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Peers[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function update(address, options, cb) {
    Peers[db.getCurrentConnection()].updateOne({address: address}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}

function count(cb) {
    Peers[db.getCurrentConnection()].countDocuments({}, function (err, count) {
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
