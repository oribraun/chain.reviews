var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var TxSchema = new Schema({
  blockhash: { type: String, index: true, unique: true },
  timestamp: { type: Number, default: 0 },
  blockindex: {type: Number, default: 0, index: true},
}, {id: false, timestamps: true});
var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('Block', TxSchema);
}
module.exports = obj;
