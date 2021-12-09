const { request } = require("http");
const https = require("https");

/**
 * LinkedinApiRequest constructor.
 * @param {String} clientId
 * @param {String} clientSecret
 * @param {String} accessToken
 */
const LinkedinApiRequest = function (clientId, clientSecret, accessToken = "") {
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._accessToken = accessToken;
};

/**
 * Get access token.
 * @param {any} params
 * @returns {Promise<any>}
 */
LinkedinApiRequest.prototype.getAccessToken = function (fetchTokenGrantType, params) {
    /* eslint-disable camelcase */
    params.grant_type = fetchTokenGrantType;
    params.client_id = this._clientId;
    params.client_secret = this._clientSecret;
    /* eslint-enable camelcase */

    return new Promise(function (resolve, reject) {
        const query = Object.keys(params)
            .map((key) => `${key}=${encodeURIComponent(params[key])}`)
            .join("&");

        const options = {
            host: "www.linkedin.com",
            method: "POST",
            path: `/oauth/v2/accessToken?${query}`,
            headers: {
                "Cache-Control": "no-cache",
            },
        };

        let data = "";
        const request = https.request(options, function (res) {
            res.on("data", function (chunk) {
                data += chunk;
            });

            res.on("end", function () {
                resolve(JSON.parse(data));
            });
        });

        request.end();
    });
};

/**
 * Set new access token.
 * @param {String} token
 */
LinkedinApiRequest.prototype.setAccessToken = function (accessToken) {
    this._accessToken = accessToken;
};

/**
 * Make request to linkedin api server.
 * @param {"GET" | "POST" | "PUT" | "DELETE"} method
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
LinkedinApiRequest.prototype.request = function (method, url, data = {}, headers = {}) {
    const { _accessToken } = this;

    return new Promise(function (resolve, reject) {
        const options = {
            host: "api.linkedin.com",
            method: method,
            path: `/v2${url}`,
            headers: {
                Authorization: `Bearer ${_accessToken}`,
                "Cache-Control": "no-cache",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        };

        Object.keys(headers).forEach(function (key) {
            options.headers[key] = headers[key];
        });

        let data = "";
        https
            .request(options, function (res) {
                res.on("data", function (chunk) {
                    data += chunk;
                });

                res.on("end", function () {
                    const response = JSON.parse(data);
                    if (response.status && response.status >= 400) {
                        reject({
                            httpCode: response.status,
                            serviceCode: response.serviceErrorCode,
                            message: response.message,
                        });
                    } else {
                        resolve(response);
                    }
                });
            })
            .end();
    });
};

/**
 * Make GET request to linkedin api server.
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
LinkedinApiRequest.prototype.get = function (url, data = {}, headers = {}) {
    return this.request("GET", url, data, headers);
};

/**
 * Make POST request to linkedin api server.
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
LinkedinApiRequest.prototype.post = function (url, data = {}, headers = {}) {
    return this.request("POST", url, data, headers);
};

/**
 * Make PUT request to linkedin api server.
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
LinkedinApiRequest.prototype.put = function (url, data = {}, headers = {}) {
    return this.request("PUT", url, data, headers);
};

/**
 * Make DELETE request to linkedin api server.
 * @param {String} url
 * @param {any} data
 * @param {any} headers
 */
LinkedinApiRequest.prototype.delete = function (url, data = {}, headers = {}) {
    return this.request("DELETE", url, data, headers);
};

module.exports = LinkedinApiRequest;
