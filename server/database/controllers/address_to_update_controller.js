var AddressToUpdate = require('../models/address_to_update');
const helpers = require('../../helpers');
var db = require('./../db');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    AddressToUpdate[db.getCurrentConnection()].find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    AddressToUpdate[db.getCurrentConnection()].findOne({_id: obj._id}, function(err, address) {
        if(err) {
            return cb(err);
        }
        if(address) { // exist
            address.address = obj.address;
            address.txid = obj.txid;
            address.amount = obj.amount;
            address.type = obj.type;
            address.blockindex = obj.blockindex;
            address.save(function (err, tx) {
                if (err) {
                    return cb(err);
                } else {
                    return cb();
                }
            });
        } else { // create new
            var newAddress = new AddressToUpdate[db.getCurrentConnection()]({
                address: obj.address,
                txid: obj.txid,
                amount: obj.amount,
                type: obj.type,
                blockindex: obj.blockindex,
            });
            newAddress.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            });
        }
    });
}

function getOne(id, cb) {
    AddressToUpdate[db.getCurrentConnection()].findOne({_id: id}, function(err, address) {
        if(address) {
            return cb(address);
        } else {
            return cb();
        }
    });
}

function deleteOne(id, cb) {
    AddressToUpdate[db.getCurrentConnection()].deleteOne({_id: id}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    AddressToUpdate[db.getCurrentConnection()].deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function count(cb) {
    AddressToUpdate[db.getCurrentConnection()].countDocuments({}, function (err, count) {
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
module.exports.count = count;
