const emitter = require("./emitter");

module.exports = {
    emitter: emitter,
    socket: function (moduleName) {
        return require(`../../../modules/${moduleName}/socket`);
    },
};
