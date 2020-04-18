var validations =  require('./entities_validations');

class MasternodeCount {
    _total = 0;
    _stable = 0;
    // obfcompat = 0;
    _enabled = 0;
    // inqueue = 0;
    // ipv4 = 0;
    // ipv6 = 0;
    // onion = 0;

    constructor(obj) {
        if(obj) {
            this.total = obj.total;
            this.stable = obj.stable;
            this.enabled = obj.enabled;
        }
    }

    get total() {
        return this._total;
    }

    set total(value) {
        if(validations.numberValidation('total', value)) {
            this._total = value;
        }
    }

    get stable() {
        return this._stable;
    }

    set stable(value) {
        if(validations.numberValidation('stable', value)) {
            this._stable = value;
        }
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(value) {
        if(validations.numberValidation('enabled', value)) {
            this._enabled = value;
        }
    }
}

module.exports = MasternodeCount;
