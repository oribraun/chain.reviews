var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var TxVinVoutSchema = new Schema({
  txid: { type: String, lowercase: true, unique: true, index: true},
  vin: { type: Array, default: [] },
  vout: { type: Array, default: [] },
  total: { type: Number, default: 0 },
  blockindex: {type: Number, default: 0, index: true},
}, {id: false});
var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('TxVinVout', TxVinVoutSchema);
}
module.exports = obj;