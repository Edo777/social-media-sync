const idRange = {
    min: "100_000_0000",
    max: "999_999_9999",
};

["min", "max"].forEach(function (key) {
    idRange[key] = parseInt(idRange[key].replace(/\_/g, ""));
});

/**
 * Convert customer id to numeric os string type.
 * @param {String|Number} customerId
 * @param {"n"|"num|"numeric"|"s"|"str"|"string"}
 * @returns {Number|String}
 */
module.exports = function (customerId, type) {
    try {
        const validId = (customerId || 0).toString().replace(/\D/g, "");
        const numericId = parseInt(validId);

        if (numericId >= idRange.min && numericId <= idRange.max) {
            if (["n", "num", "numeric"].includes(type)) {
                return numericId;
            }

            if (["s", "str", "string"].includes(type)) {
                const v = numericId.toString();
                return v.substr(0, 3) + "-" + v.substr(3, 3) + "-" + v.substr(6);
            }
        }
    } catch (e) {}

    return null;
};
