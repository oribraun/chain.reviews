var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

// saving addresses amount for trying partial reindex with partial blockindex delete
var AddressToUpdateSchema = new Schema({
  address: { type: String, index: true},
  txid: { type: String, default: '' },
  txid_timestamp: { type: Number, default: 0, index: true },
  txid_type: { type: Number, default: 0, index: true },
  order: { type: Number, default: 0},
  amount: { type: Number, default: 0 , index: true},
  balance: { type: Number, default: 0 , index: true},
  sent: { type: Number, default: 0},
  received: { type: Number, default: 0},
  type: { type: String, default: '' },
  blockindex: {type: Number, default: 0, index: true},
}, {id: false, timestamps: true});

AddressToUpdateSchema.index({ order: 1, address: 1 }, { unique: true, partialFilterExpression: { order: { $gt: 0 }}});
AddressToUpdateSchema.index({address: 1, blockindex: 1, order: 1}, {background:true});
AddressToUpdateSchema.index({address: 1, blockindex: -1, order: -1}, {background:true});
AddressToUpdateSchema.index({blockindex: -1});
var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('AddressToUpdate', AddressToUpdateSchema);
}
module.exports = obj;
