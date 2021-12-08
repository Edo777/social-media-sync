const EventEmitter = require("events");
const socketEmitter = require("./socket/emitter");

const emitters = {};
module.exports = function (moduleName) {
    if (!emitters[moduleName]) {
        const localEmitter = new EventEmitter();
        socketEmitter.pingWith(moduleName, localEmitter);

        emitters[moduleName] = localEmitter;
    }

    return emitters[moduleName];
};
