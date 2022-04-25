const request = require("request");

/**
 * Default callback.
 * @param {String | null} error
 */
const defaultCallback = function (error) {
    if (!error) {
        return;
    }

    console.error("--- SOCKET ERROR --------------------------------------");
    console.error(error);
    console.log();
};

/**
 * Make ping request.
 * @param {String} url
 */
const makePingData = function (url) {
    return {
        method: "GET",
        url: url,
        headers: {
            "x-socket-token": process.env.SOCKET_TOKEN,
        },
    };
};

/**
 * Make socket piong handler.
 * @param {Function|null} callback
 */
const handlePingResponse = function (callback) {
    if (!callback) {
        callback = defaultCallback;
    }

    return function (err, response, body) {
        if (err) {
            console.log(
                err,
                "--------------------------------------------------------- ERRRRRR",
                `${__filename}:45`
            );
            return callback(err.message);
        }

        try {
            const result = JSON.parse(body);
            switch (result.status) {
                case "FAIL":
                    return callback(result.message);

                case "OK":
                    return callback(null);
            }

            callback(body);
        } catch (e) {
            callback(`Could not parse response body as json: ${body}`);
        }
    };
};

/**
 * Pint to sockets.
 * @param {String} event
 * @param {any} data
 * @param {Function|null} callback
 */
const ping = function (moduleName, event, data, callback) {
    const dataString = encodeURIComponent(JSON.stringify(data));
    const { port } = require(`../../../../modules/${moduleName}/socket`);

    const url = `http://localhost:${port}/emit/${event}?data=${dataString}`;
    const pingData = makePingData(url);

    console.log(pingData, "+++++++++++++++++++++++++++++++++++++++++++++++++", `${__filename}:78`);
    request(pingData, handlePingResponse(callback));
};

module.exports = function (moduleName, localEmitter) {
    localEmitter.on("socket-ping", function ({ event, data, callback }) {
        const keysCount = Object.keys(data).length;
        if (keysCount == 0) {
            return callback(null);
        }

        ping(moduleName, event, data, callback);
    });
};
