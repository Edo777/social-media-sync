/**
 * Zerofill number.
 * @param {Number} value
 * @param {Number} length
 * @returns {String}
 */
module.exports = function (value, length = 2) {
    value = value.toString();
    while (value.length < length) {
        value = `0${value}`;
    }

    return value;
};
