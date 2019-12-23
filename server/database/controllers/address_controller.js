var Address = require('../models/address');
const helpers = require('../../helpers');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Address.find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    Address.findOne({a_id: obj.hash}, function(err, address) {
        if(err) {
            return cb(err);
        }
        if(address) { // exist
            address.txs = obj.txs;
            address.received = obj.received;
            address.sent = obj.sent;
            address.balance = obj.balance;
            address.updateOne(function (err, tx) {
                if (err) {
                    return cb(err);
                } else {
                    return cb();
                }
            });
        } else { // create new
            var newAddress = new Address({
                txs: obj.txs,
                received: obj.received,
                sent: obj.sent,
                balance: obj.balance
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

function getOne(hash, cb) {
    Address.findOne({a_id: hash}, function(err, address) {
        if(address) {
            return cb(address);
        } else {
            return cb();
        }
    });
}

function deleteOne(a_id, cb) {
    Address.deleteOne({a_id: a_id}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Address.deleteMany({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function updateAddress(hash, txid, amount, type, cb) {
    // Check if address exists
    getOne(hash, function(address) {
        if (address) {
            console.log('exist')
            // if coinbase (new coins PoW), update sent only and return cb.
            if ( hash == 'coinbase' ) {
                address.sent = address.sent + amount
                address.balance = 0;
                address.save(function(err) {
                    if (err) {
                        return cb(err);
                    } else {
                        //console.log('txid: ');
                        return cb();
                    }
                })
            } else {
                // ensure tx doesnt already exist in address.txs
                helpers.is_unique(address.txs, txid).then(function(unique, index){
                    var tx_array = address.txs;
                    var received = address.received;
                    var sent = address.sent;
                    if (type == 'vin') {
                        sent = sent + amount;
                    } else {
                        received = received + amount;
                    }
                    if (unique == true) {
                        tx_array.push({addresses: txid, type: type});
                        // if ( tx_array.length > settings.txcount ) {
                        //   tx_array.shift();
                        // }
                        Address.updateOne({a_id:hash}, {
                            txs: tx_array,
                            received: received,
                            sent: sent,
                            balance: received - sent
                        }, function() {
                            return cb();
                        });
                    } else {
                        if (type == tx_array[index].type) {
                            return cb(); //duplicate
                        } else {
                            Address.updateOne({a_id:hash}, {
                                txs: tx_array,
                                received: received,
                                sent: sent,
                                balance: received - sent
                            }, function() {
                                return cb();
                            });
                        }
                    }
                })
            }
        } else {
            console.log('new')
            //new address
            if (type == 'vin') {
                var newAddress = new Address({
                    a_id: hash,
                    txs: [ {addresses: txid, type: 'vin'} ],
                    sent: amount,
                    balance: amount,
                });
            } else {
                var newAddress = new Address({
                    a_id: hash,
                    txs: [ {addresses: txid, type: 'vout'} ],
                    received: amount,
                    balance: amount,
                });
            }

            newAddress.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('address saved: %s', hash);
                    //console.log(newAddress);
                    return cb();
                }
            });
        }
    });
}

function getRichlist(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Address.find({}).sort(sort).limit(limit).exec(function(err, addresses){
        if(err) {
            return cb(err);
        }
        return cb(addresses);
    });
}

function update(coin, options, cb) {
    Address.updateOne({coin: coin}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}
function updateAddress1(address, hash, txid, amount, type, cb) {
    // Check if address exists
    if (address) {
        // if coinbase (new coins PoW), update sent only and return cb.
        if ( hash == 'coinbase' ) {
            Address.updateOne({a_id:hash}, {
                sent: address.sent + amount,
                balance: 0,
            }, function() {
                return cb();
            });
        } else {
            // ensure tx doesnt already exist in address.txs
            helpers.is_unique(address.txs, txid).then(function(unique, index){
                var tx_array = address.txs;
                var received = address.received;
                var sent = address.sent;
                if (type == 'vin') {
                    sent = sent + amount;
                } else {
                    received = received + amount;
                }
                if (unique == true) {
                    tx_array.push({addresses: txid, type: type});
                    // if ( tx_array.length > settings.txcount ) {
                    //   tx_array.shift();
                    // }
                    Address.updateOne({a_id:hash}, {
                        txs: tx_array,
                        received: received,
                        sent: sent,
                        balance: received - sent
                    }, function() {
                        return cb();
                    });
                } else {
                    if (type == tx_array[index].type) {
                        return cb(); //duplicate
                    } else {
                        Address.updateOne({a_id:hash}, {
                            txs: tx_array,
                            received: received,
                            sent: sent,
                            balance: received - sent
                        }, function() {
                            return cb();
                        });
                    }
                }
            })
        }
    }
}
function createAddress1(hash, txid, amount, type, cb) {
    //new address
    if (type == 'vin') {
        var newAddress = new Address({
            a_id: hash,
            txs: [ {addresses: txid, type: 'vin'} ],
            sent: amount,
            balance: amount,
        });
    } else {
        var newAddress = new Address({
            a_id: hash,
            txs: [ {addresses: txid, type: 'vout'} ],
            received: amount,
            balance: amount,
        });
    }

    newAddress.save(function(err) {
        if (err) {
            return cb(err);
        } else {
            //console.log('address saved: %s', hash);
            //console.log(newAddress);
            return cb();
        }
    });
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.updateAddress = updateAddress;
module.exports.getRichlist = getRichlist;
module.exports.update = update;

module.exports.updateAddress1 = updateAddress1;
module.exports.createAddress1 = createAddress1;
