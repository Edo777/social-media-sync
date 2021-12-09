/**
 * Get resource id from resource name.
 * @param {String} resourceName
 * @returns {Number|null}
 */
module.exports = function (resourceName) {
    try {
        const resourceParts = resourceName.split("/");
        return parseInt(resourceParts[3]) || null;
    } catch (e) {
        return null;
    }
};
