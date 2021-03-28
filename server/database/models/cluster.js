var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var ClusterSchema = new Schema({
  addresses: { type: Array, default: [] },
  update: { type: Boolean, default: false },
  changed: { type: Boolean, default: false },
  tags: { type: Array, default: [] },
}, {id: false, timestamps: false});

var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('Cluster', ClusterSchema);
}
module.exports = obj;
