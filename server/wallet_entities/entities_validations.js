var validations = {
    numberValidation: (key, value) => {
        if(typeof value === 'number') {
            return true;
        } else {
            throw key + ' is not a number';
        }
    },
    stringLengthValidation: (key, length, value) => {
        if(typeof value === 'string' && value.length === length) {
            return true;
        } else {
            throw key + ' is not a string or length is not 64';
        }
    },
    stringValidation: (key, value) => {
        if(typeof value === 'string') {
            return true;
        } else {
            throw key + ' is not a string';
        }
    },
    arrayValidation: (key, value) => {
        if(Array.isArray(value)) {
            return true;
        } else {
            throw key + ' is not and array';
        }
    },
    arrayOfValidation: (key, of, value) => {
        if(Array.isArray(value)) {
            return true;
        } else {
            throw key + ' is not and array of ' + of;
        }
    },
}
module.exports = validations;

