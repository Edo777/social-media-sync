const path = require("path");

module.exports = function (appDirsRoot) {
    return {
        clientSession: path.join(appDirsRoot, "client-sessions"),
    };
};
