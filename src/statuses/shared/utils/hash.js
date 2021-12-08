const crypto = require("crypto");

module.exports = function (plain, algorithm = "sha256") {
    return crypto.createHash(algorithm).update(plain.toString()).digest("hex");
};
