const request = require("request");
const querystring = require("querystring");

const constants = {
    API_HOST_PRODUCTION: "https://ads-api.twitter.com/",
    API_HOST_SANDBOX: "https://ads-api-sandbox.twitter.com/",
    STATUS_CODES_TO_ABORT_ON: [400, 401, 403, 404, 406, 410, 413, 422],
    JSON_PATHS: ["tailored_audience_memberships"],
};

const _makeQueryString = function (obj) {
    return querystring.stringify(obj, null, null, {
        encodeURIComponent: function (str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
                return "%" + c.charCodeAt(0).toString(16);
            });
        },
    });
};

const _moveParamsIntoPath = function (path, params) {
    return path.replace(/\/:(\w+)/g, function (hit) {
        const paramName = hit.slice(2);
        if (!params[paramName]) {
            throw new Error(
                `TwitterApiRequest: Params object is missing a required ` +
                    `parameter for this request: "${paramName}"`
            );
        }

        const retVal = "/" + params[paramName];
        delete params[paramName];
        return retVal;
    });
};

const _normalizeParams = function (params) {
    const normalized = params || {};
    if (params && typeof params === "object") {
        Object.keys(params).forEach(function (k) {
            if (Array.isArray(params[k])) {
                normalized[k] = params[k].join(",");
            }
        });
    }

    return normalized;
};

const _parseResponse = function (response, body, callback) {
    let parsedBody = null;
    if (body) {
        if (typeof body === "object") {
            parsedBody = body;
        } else if (response.headers["content-type"].includes("application/json")) {
            try {
                parsedBody = JSON.parse(body);
            } catch (e) {
                parsedBody = body;
            }
        }
    }

    if (
        constants.STATUS_CODES_TO_ABORT_ON.includes(response.statusCode) ||
        (parsedBody && parsedBody.errors && parsedBody.errors.length)
    ) {
        const err = new Error(
            `Bad status code returned: ${response.statusCode}\n ` +
                `Twitter Replied: ${body.toString()}.`
        );

        err.allErrors = [];
        if (parsedBody && parsedBody.errors && parsedBody.errors.length) {
            err.allErrors = parsedBody.errors;
            err.message = "Twitter-Ads API Error: " + parsedBody.errors[0].message;
        }

        return callback(err, response, parsedBody || body);
    }

    return callback(null, response, parsedBody || body);
};

/**
 * TwitterApiRequest constructor.
 * @param {any} options
 */
const TwitterApiRequest = function (options) {
    this._config = {
        /* eslint-disable camelcase */
        api_version: "2",
        sandbox: options.sandbox,
        consumer_key: options.consumer_key,
        consumer_secret: options.consumer_secret,
        access_token: options.access_token,
        access_token_secret: options.access_token_secret,
        /* eslint-enable camelcase */
    };
};

/**
 * Make reqeust to twitter api.
 * @param {String} method
 * @param {String} url
 * @param {any} params
 * @param {any} body
 * @param {Function} callback
 */
TwitterApiRequest.prototype._makeRequest = function (method, url, params, body, callback) {
    let paramsCopy = JSON.parse(JSON.stringify(params));

    let finalUrl = url;
    if (Object.keys(paramsCopy).length !== 0) {
        finalUrl = _moveParamsIntoPath(url, paramsCopy);
    }

    paramsCopy = _normalizeParams(paramsCopy);

    const host = !this._config.sandbox ? constants.API_HOST_PRODUCTION : constants.API_HOST_SANDBOX;

    const requestConfig = {
        /* eslint-disable camelcase */
        method: method.toUpperCase(),
        baseUrl: `${host}${this._config.api_version}/`,
        url: Object.keys(paramsCopy).length
            ? finalUrl + "?" + _makeQueryString(paramsCopy)
            : finalUrl,
        oauth: {
            consumer_key: this._config.consumer_key,
            consumer_secret: this._config.consumer_secret,
            token: this._config.access_token,
            token_secret: this._config.access_token_secret,
        },
        /* eslint-enable camelcase */
    };

    if (["POST", "PUT"].includes(requestConfig.method)) {
        requestConfig.json = true;
        requestConfig.body = body;
    } else {
        // requestConfig.useQuerystring = true;
        // requestConfig.gzip = true;
    }

    request(requestConfig, function (err, resp, body) {
        if (err) {
            return callback(err);
        }

        _parseResponse(resp, body, callback);
    });
};

/**
 * Make request to twitter api with promise.
 * @param {"GET" | "POST" | "PUT" | "DELETE"} method
 * @param {String} url
 * @param {any} params
 * @param {any} body
 * @return {Promise<any>}
 */
TwitterApiRequest.prototype.request = function (method, url, params = {}, body = {}) {
    const _this = this;
    return new Promise(function (resolve, reject) {
        _this._makeRequest(method, url, params, body, function (result) {
            if (result instanceof Error) {
                return reject(result);
            }

            resolve(result);
        });
    });
};

/**
 * Make GET request to twitter api.
 * @param {String} url
 * @param {any} params
 * @return {Promise<any>}
 */
TwitterApiRequest.prototype.get = function (url, params = {}) {
    return this.request("get", url, params);
};

/**
 * Make POST request to twitter api.
 * @param {String} url
 * @param {any} params
 * @param {any} body
 * @return {Promise<any>}
 */
TwitterApiRequest.prototype.post = function (url, params = {}, body = {}) {
    return this.request("post", url, params, body);
};

/**
 * Make PUT request to twitter api.
 * @param {String} url
 * @param {any} params
 * @param {any} body
 * @return {Promise<any>}
 */
TwitterApiRequest.prototype.put = function (url, params = {}, body = {}) {
    return this.request("put", url, params, body);
};

/**
 * Make DELETE request to twitter api.
 * @param {String} url
 * @param {any} params
 * @return {Promise<any>}
 */
TwitterApiRequest.prototype.delete = function (url, params = {}) {
    return this.request("delete", url, params);
};

exports = module.exports = TwitterApiRequest;
