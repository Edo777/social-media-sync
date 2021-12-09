/**
 * Append resource id and name to an object from resource name.
 * @param {String} resourceName
 */
module.exports = function (object, resourceName) {
    try {
        const resourceParts = resourceName.split("/");

        object.resource = resourceName;
        object.id = parseInt(resourceParts[3]) || null;
    } catch (e) {}
};
