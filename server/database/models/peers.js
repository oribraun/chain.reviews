var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var PeersSchema = new Schema({
  createdAt: { type: Date, expires: 86400, default: Date.now()},
  address: { type: String, default: "" },
  protocol: { type: String, default: "" },
  version: { type: String, default: "" },
  country: { type: String, default: "" },
  lastactivity: { type: String, default: "" },
  connectiontime: { type: String, default: "" }
});

var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('Peers', PeersSchema);
}
module.exports = obj;
