const bcrypt = require("bcrypt");
const saltRounds = 10;

/**
 * Generate password hash.
 * @param {String} password
 */
function hash(password) {
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
}

/**
 * Verify password hash.
 * @param {String} password
 * @param {String} hashed
 */
function verify(password, hashed) {
    return bcrypt.compareSync(password, hashed);
}

module.exports = {
    hash: hash,
    verify: verify,
};
