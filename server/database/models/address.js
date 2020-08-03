var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var AddressSchema = new Schema({
  a_id: { type: String, unique: true, index: true},
  received: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },
  balance: {type: Number, default: 0},
  last_order: {type: Number, default: 0},
  last_blockindex: {type: Number, default: 0},
}, {id: false, timestamps: false});

// AddressSchema.index({balance: -1});
// AddressSchema.index({received: -1});
AddressSchema.index({balance: 1});
AddressSchema.index({received: 1});
var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('Address', AddressSchema);
}
module.exports = obj;
