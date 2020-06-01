var ClustersBlock = require('../models/clusters_block');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    ClustersBlock[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, clusters_block) {
        if(clusters_block) {
            return cb(clusters_block);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    ClustersBlock[db.getCurrentConnection()].findOne({name: obj.name}, function(err, clusters_block) {
        if(err) {
            return cb(err);
        }
        if(clusters_block) { // exist
            clusters_block.block = obj.block;
            clusters_block.save(function(err) {
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
            var newClusters_block = new ClustersBlock[db.getCurrentConnection()]({
                name: obj.name,
                block: obj.block,
            });

            newClusters_block.save(function(err) {
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

function deleteAll(cb) {
    ClustersBlock[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function count(cb) {
    ClustersBlock[db.getCurrentConnection()].countDocuments({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

function estimatedDocumentCount(cb) {
    ClustersBlock[db.getCurrentConnection()].estimatedDocumentCount({}, function (err, count) {
        if(err) {
            cb()
        } else {
            cb(count);
        }
    });
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.deleteAll = deleteAll;
module.exports.count = count;
module.exports.estimatedDocumentCount = estimatedDocumentCount;
