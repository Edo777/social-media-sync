const https = require("https");

/**
 * TiktokApiRequest constructor.
 * @param {String} appId
 * @param {String} secret
 * @param {String} accessToken
 */
const TiktokApiRequest = function (appId, secret, accessToken = "") {
    this._appId = appId;
    this._secret = secret;
    this._accessToken = accessToken;
};

/**
 * Get access token.
 * @param {any} params
 * @returns {Promise<any>}
 */
TiktokApiRequest.prototype.getAccessToken = function (code) {
    const { _appId, _secret } = this;
    const params = JSON.stringify({
        /* eslint-disable camelcase */
        auth_code: code,
        app_id: _appId,
        secret: _secret,
        /* eslint-enable camelcase */
    });

    return new Promise(function (resolve, reject) {
        const options = {
            host: "ads.tiktok.com",
            method: "POST",
            path: `/open_api/oauth2/access_token_v2/`,
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(params),
                "Cache-Control": "no-cache",
            },
        };

        let data = "";
        const request = https.request(options, function (res) {
            res.on("data", function (chunk) {
                data += chunk;
            });

            res.on("end", function () {
                const result = JSON.parse(data);
                resolve(result.data);
            });
        });

        request.write(params);
        request.end();
    });
};

/**
 * Set new access token.
 * @param {String} token
 */
TiktokApiRequest.prototype.setAccessToken = function (accessToken) {
    this._accessToken = accessToken;
};

/**
 * Make request to tik-tok api server.
 * @param {"GET" | "POST" | "PUT" | "DELETE"} method
 * @param {String} url
 * @param {any} postData
 * @param {any} headers
 */
TiktokApiRequest.prototype.request = function (method, url, postData = {}, headers = {}) {
    const { _accessToken } = this;

    return new Promise(function (resolve, reject) {
        let apiUrl = url;
        if (!apiUrl.endsWith("/")) {
            apiUrl += "/";
        }

        const options = {
            host: "ads.tiktok.com",
            method: method,
            path: `/open_api/v1.1${apiUrl}`,
            headers: {
                "Access-Token": _accessToken,
                "Cache-Control": "no-cache",
            },
        };

        Object.keys(headers).forEach(function (key) {
            options.headers[key] = headers[key];
        });

        const isWithBody = ["POST", "PUT"].includes(options.method);
        if (!isWithBody) {
            const query = Object.keys(postData)
                .map(function (key) {
                    let value = postData[key];
                    if ("object" === typeof value) {
                        value = JSON.stringify(value);
                    }

                    return `${key}=${encodeURIComponent(value)}`;
                })
                .join("&");

            options.path += `?${query}`;
        }

        let dataResponse = "";
        const request = https.request(options, function (res) {
            res.on("data", function (chunk) {
                dataResponse += chunk;
            });

            res.on("end", function () {
                try {
                    const response = JSON.parse(dataResponse);
                    if (res.statusCode && res.statusCode >= 400) {
                        return reject({
                            httpCode: res.statusCode,
                        });
                    }

                    if (response.code) {
                        return reject({
                            apiCode: response.code,
                            message: response.message,
                        });
                    }

                    resolve(response);
                } catch (e) {
                    resolve(null);
                }
            });
        });

        if (isWithBody) {
            request.write(JSON.stringify(postData));
        }

        request.end();
    });
};

/**
 * Make GET request to tik-tok api server.
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
TiktokApiRequest.prototype.get = function (url, data = {}, headers = {}) {
    return this.request("GET", url, data, headers);
};

/**
 * Make POST request to tik-tok api server.
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
TiktokApiRequest.prototype.post = function (url, data = {}, headers = {}) {
    return this.request("POST", url, data, headers);
};

/**
 * Make PUT request to tik-tok api server.
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
TiktokApiRequest.prototype.put = function (url, data = {}, headers = {}) {
    return this.request("PUT", url, data, headers);
};

/**
 * Make DELETE request to tik-tok api server.
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
TiktokApiRequest.prototype.delete = function (url, data = {}, headers = {}) {
    return this.request("DELETE", url, data, headers);
};

module.exports = TiktokApiRequest;
