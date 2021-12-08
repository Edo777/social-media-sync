const crypto = require("crypto");

const CIPHER_ALGORITHM = "aes-256-ctr";
const FACTORY_COUNT = 2;
const REAL_KEY_LENGTH = 20;
const KEY_APPEND_LENGTH = 10;

const _randomString = function (length) {
    const CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let characters = CHARACTERS;

    let result = "";
    for (let i = 0; i < length; ++i) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));

        if (i == 0) {
            characters = characters + "0123456789$%&._";
        }
    }

    return result;
};

const _appendSuffix = function (key) {
    const randomSuffix = _randomString(KEY_APPEND_LENGTH, "uln");
    return key + randomSuffix;
};

const _removeSuffix = function (key) {
    return key.substr(0, key.length - KEY_APPEND_LENGTH);
};

const _getSha256Digest = function (key) {
    const realKey = _removeSuffix(key);
    const sha256 = crypto.createHash("sha256");
    sha256.update(realKey);

    return sha256.digest();
};

const _encrtyptData = function (data, key) {
    const digest = _getSha256Digest(key);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(CIPHER_ALGORITHM, digest, iv);
    const cipherText = cipher.update(Buffer.from(data));

    return Buffer.concat([iv, cipherText, cipher.final()]).toString("base64");
};

/**
 * Generate random key.
 * @returns string
 */
const generateKey = function () {
    const realKey = _randomString(REAL_KEY_LENGTH, "uln");
    return _appendSuffix(realKey);
};

/**
 * Encrypt data with key.
 * @param data string
 * @param key string
 * @returns string
 */
const encrypt = function (data, key = "ZrtYpvTut") {
    let replacedData = data;
    for (let i = 0; i < FACTORY_COUNT; ++i) {
        const digest = _getSha256Digest(key);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv(CIPHER_ALGORITHM, digest, iv);

        const cipherText = cipher.update(Buffer.from(replacedData));
        replacedData = Buffer.concat([iv, cipherText, cipher.final()]).toString("base64");
    }

    return replacedData;
};

/**
 * Decrypt data with key.
 * @param data string
 * @param key string
 * @returns string
 */
const decrypt = function (data, key = "ZrtYpvTut") {
    let replacedData = data;
    for (let i = 0; i < FACTORY_COUNT; ++i) {
        const digest = _getSha256Digest(key);

        const input = Buffer.from(replacedData, "base64");
        const iv = input.slice(0, 16);
        const decipher = crypto.createDecipheriv(CIPHER_ALGORITHM, digest, iv);
        const cipherText = input.slice(16);

        replacedData = decipher.update(cipherText) + decipher.final();
    }

    return replacedData;
};

module.exports = {
    generateKey: generateKey,
    encrypt: encrypt,
    decrypt: decrypt,
};
