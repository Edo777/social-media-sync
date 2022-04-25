const SocketIO = require("socket.io");
const http = require("http");
const express = require("express");
const socket = require("./socket");

const app = express();
const server = http.createServer(app);
const io = SocketIO(server);

if(io && io.set) {
    io.set("transports", ["websocket", "polling"]);
}

app.get("/emit/:event", socket.emitter.handle(io));

module.exports = function (moduleName) {
    const socketInfo = socket.socket(moduleName);
    socketInfo.registerListeners(io);

    const port = socketInfo.port;
    server.listen(port, function () {
        console.log(`Socket app listening on port ${port} !!!`);
    });
};
