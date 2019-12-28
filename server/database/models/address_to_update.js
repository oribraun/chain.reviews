var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

// saving addresses amount for trying partial reindex with partial blockindex delete
var AddressToUpdateSchema = new Schema({
  address: { type: String, index: true},
  txid: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  type: { type: String, default: '' },
  blockindex: {type: Number, default: 0},
}, {id: false});

var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('AddressToUpdate', AddressToUpdateSchema);
}
module.exports = obj;
