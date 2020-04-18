var validations =  require('./entities_validations');

class TxOutsetInfo {
    _height = -1;
    _bestblock = "";
    _transactions = -1;
    _txouts = -1;
    _bytes_serialized = -1;
    _hash_serialized = "";
    _total_amount = -1

    constructor(obj) {
        if(obj) {
            this.height = obj.height;
            this.bestblock = obj.bestblock;
            this.transactions = obj.transactions;
            this.txouts = obj.txouts;
            this.bytes_serialized = obj.bytes_serialized;
            this.hash_serialized = obj.hash_serialized;
            this.total_amount = obj.total_amount;
        }
    }

    get height() {
        return this._height;
    }

    set height(value) {
        if(validations.numberValidation('height', value)) {
            this._height = value;
        }
    }

    get bestblock() {
        return this._bestblock;
    }

    set bestblock(value) {
        if(validations.stringLengthValidation('bestblock', 64, value)) {
            this._bestblock = value;
        }
    }

    get transactions() {
        return this._transactions;
    }

    set transactions(value) {
        if(validations.numberValidation('transactions', value)) {
            this._transactions = value;
        }
    }

    get txouts() {
        return this._txouts;
    }

    set txouts(value) {
        if(validations.numberValidation('txouts', value)) {
            this._txouts = value;
        }
    }

    get bytes_serialized() {
        return this._bytes_serialized;
    }

    set bytes_serialized(value) {
        if(validations.numberValidation('bytes_serialized', value)) {
            this._bytes_serialized = value;
        }
    }

    get hash_serialized() {
        return this._hash_serialized;
    }

    set hash_serialized(value) {
        if(validations.stringLengthValidation('hash_serialized', 64, value)) {
            this._hash_serialized = value;
        }
    }

    get total_amount() {
        return this._total_amount;
    }

    set total_amount(value) {
        if(validations.numberValidation('total_amount', value)) {
            this._total_amount = value;
        }
    }
}

module.exports = TxOutsetInfo;
