const prefixes = {};

module.exports = function (moduleName, source, sliceWord, isReplaceSlashes) {
    if (!prefixes.hasOwnProperty(moduleName)) {
        const routesPath = `../../modules/${moduleName}/routes`;
        prefixes[moduleName] = require(routesPath).prefix;
    }

    let url = "";
    if (isReplaceSlashes) {
        let sourcePath = source.replace(/\\/g, "/");
        if (sourcePath.startsWith("/")) {
            sourcePath = sourcePath.substr(1);
        }

        url = sourcePath.slice(sourcePath.indexOf(sliceWord) - 1);
    } else {
        url = source.slice(source.indexOf(sliceWord) - 1);
    }

    return (prefixes[moduleName] + url).replace(/\/\//g, "/");
};
