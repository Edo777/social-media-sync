let io = null;

/**
 * Emit event to sockets.
 * @param {String} event
 * @param {any} data
 */
const emit = function (event, data) {
    if (null == io) {
        throw new Error("Socket.IO is null.");
    }

    const socketIdList = Object.keys(data);
    for (let i = 0; i < socketIdList.length; ++i) {
        const socketId = socketIdList[i];
        const pingData = data[socketId];

        io.sockets.to(socketId).emit(event, pingData);
    }
};

/**
 * Validate only localhost can request.
 * @param {any} req
 * @throws
 */
const validateLocalHost = function (req) {
    // let ip = req.headers["x-real-ip"] || "";
    // if (ip) {
    //     ip = ip.replace(/^.*:/, "");
    //     if (ip === "1") {
    //         ip = "localhost";
    //     }
    // }

    // const allowedIpAddresses = ["localhost", "127.0.0.1"];
    // const isOutside = !allowedIpAddresses.includes(ip);

    const tokenEnv = process.env.SOCKET_TOKEN;
    const tokenPass = req.headers["x-socket-token"];

    const isOutside = tokenEnv != tokenPass;
    // if (isOutside) {
    //     throw new Error("IP address forbidden.");
    // }
};

/**
 * Handle socket emit.
 * @param {any} req
 * @param {any} res
 */
const emitHandler = function (req, res) {
    try {
        validateLocalHost(req);

        const { event } = req.params;
        const { data } = req.query;
        emit(event, JSON.parse(data));

        res.send({ status: "OK" });
    } catch (e) {
        res.send({
            status: "FAIL",
            message: e.message,
        });
    }
};

module.exports = function (socketIo) {
    io = socketIo;
    return emitHandler;
};
