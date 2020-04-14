module.exports = {
    NONSTANDARD: 1, // no vout addresses
    POS: 2, // STAKE, REWARD no vin addresses
    NEW_COINS: 3, // vin address is coinbase
    NORMAL: 4, // regular tx
    NAMES: ['NONSTANDARD', 'POS', 'NEW_COINS', 'NORMAL'],
    toStr: function(num) {
        if(this.NAMES[num - 1]) {
            return this.NAMES[num - 1];
        } else {
            return 'not exist in types';
        }
    },
    getIndexOf: function(str) {
        var index = this.NAMES.indexOf(str);
        if(index > -1) {
            return index;
        } else {
            return 'not exist';
        }
    }
}
