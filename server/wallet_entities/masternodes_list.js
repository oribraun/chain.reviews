var validations =  require('./entities_validations');
var Masternode = require('./masternode');

class MasternodesList {
    _list = [];
    constructor(obj) {
        if(obj) {
            this.list = obj
        }
    }

    get list() {
        return this._list;
    }

    set list(value) {
        if(validations.arrayOfValidation('list', 'masternode', value)) {
            for (var i in value) {
                value[i] =  new Masternode(value[i]);
            }
            this._list = value;
        }
    }
}

module.exports = MasternodesList;
