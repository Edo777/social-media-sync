const http = require("http");

const token = "4a9077d3-e211-4176-b754-8b11440e7b0b";

module.exports = function (ip) {
    return new Promise(function (resolve) {
        const options = {
            hostname: "localhost",
            port: 4896,
            path: `/${token}/${ip}`,
        };

        http.get(options, function (response) {
            let body = "";
            response
                .setEncoding("utf8")
                .on("data", function (chunk) {
                    body += chunk;
                })
                .on("end", function () {
                    body = JSON.parse(body);
                    resolve(body);
                });
        });
    });
};
