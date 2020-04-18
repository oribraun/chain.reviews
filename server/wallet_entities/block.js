// undefined : typeof instance === "undefined"
// Boolean : typeof instance === "boolean"
// Number : typeof instance === "number"
// String : typeof instance === "string"
// BigInt : typeof instance === "bigint"
// Symbol : typeof instance === "symbol"
// ES6 get and set

var validations =  require('./entities_validations');
class Block {
    _hash = ''; // 64 length string
    _confirmations = 0; // int
    // _size = 298;
    _height = -1; // int
    // _version = 1;
    // _merkleroot = '17d377a8a6d988698164f5fc9ffa8d5d03d0d1187e3a0ed886c239b3eae4be2f';
    // _acc_checkpoint = '0000000000000000000000000000000000000000000000000000000000000000';
    _tx = []; // array
    _time = 0; // int
    // _mediantime = 1559224740;
    // _nonce = 3617423;
    // _bits = '1e0ffff0';
    // _difficulty = 0.000244140625;
    // _chainwork = '0000000000000000000000000000000000000000000000000000000000100010';
    // _nextblockhash = '00000cc8e391a6cbd8212446e1f730ebda98e1d2cdc5ef5efa86d0b385c6228e';
    // _moneysupply = 0;
    // _zFIXsupply = {
    //     '1' = 0,
    //     '5' = 0,
    //     '10' = 0,
    //     '50' = 0,
    //     '100' = 0,
    //     '500' = 0,
    //     '1000' = 0,
    //     '5000' = 0,
    //     total = 0
    // }
    constructor(obj) {
        if(obj) {
            this.hash = obj.hash;
            this.confirmations = obj.confirmations;
            this.height = obj.height;
            this.tx = obj.tx;
            this.time = obj.time;
        }
    }


    get hash() {
        return this._hash;
    }

    set hash(value) {
        if(validations.stringLengthValidation('hash', 64, value)) {
            this._hash = value;
        }
    }

    get confirmations() {
        return this._confirmations;
    }

    set confirmations(value) {
        if(validations.numberValidation('confirmations', value)) {
            this._hash = value;
        }
    }

    get height() {
        return this._height;
    }

    set height(value) {
        if(validations.numberValidation('height', value)) {
            this._hash = value;
        }
    }

    get tx() {
        return this._tx;
    }

    set tx(value) {
        if(validations.arrayOfValidation('tx', 'tx_hash', value)) {
            for (var i in value) {
                if(value[i].length !== 64) {
                    throw 'tx is not and array of tx_hash';
                }
            }
            this._tx = value;
        }
    }

    get time() {
        return this._time;
    }

    set time(value) {
        if(validations.numberValidation('time', value)) {
            this._hash = value;
        }
    }
}

module.exports = Block;
