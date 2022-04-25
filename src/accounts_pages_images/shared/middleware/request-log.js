const path = require("path");
const os = require("os");
const fs = require("fs");

module.exports = function (req, res, next) {
    next();

    const { method, url, ip, protocol, hostname } = req;
    const responseCode = res.statusCode;

    const realIp = req.headers["x-real-ip"];
    const whitelisted = ["178.160.251.193", "127.0.0.1", "::ffff:127.0.0.1", "::1"];

    const ipAddress = realIp || ip;
    if (!whitelisted.includes(ipAddress) && ("GET" != method || 200 != responseCode)) {
        const agent = req.headers["user-agent"];
        const date = new Date();
        const domain = `${protocol}://${hostname}`;

        let data = { date, ipAddress, realIp, method, responseCode, domain, url, agent };
        data = JSON.stringify(data) + os.EOL;

        const file = path.join(__dirname, "..", "..", "..", "requests.log");
        fs.appendFile(file, data, function () {});
    }
};
