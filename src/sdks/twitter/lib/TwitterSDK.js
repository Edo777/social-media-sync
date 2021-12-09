const https = require("https");
const { HmacSHA1, enc } = require("crypto-js");

const TwitterApiRequest = require("./TwitterApiRequest");
const TwitterBusinessSDK = require("./TwitterBusinessSDK");

/**
 * TwitterSDK constructor.
 * @param {String} consumerKey
 * @param {String} consumerSecret
 * @param {String} accessToken
 * @param {String} accessTokenSecret
 */
const TwitterSDK = function (
    consumerKey,
    consumerSecret,
    accessToken,
    accessTokenSecret,
    isSandbox
) {
    this._consumerKey = consumerKey;
    this._consumerSecret = consumerSecret;
    this._isSandbox = false;

    this._api = new TwitterApiRequest({
        /* eslint-disable camelcase */
        consumer_key: this._consumerKey,
        consumer_secret: this._consumerSecret,
        access_token: accessToken,
        access_token_secret: accessTokenSecret,
        sandbox: isSandbox,
        /* eslint-enable camelcase */
    });

    this._ads = new TwitterBusinessSDK(this._api);
};

TwitterSDK.prototype._corsFetch = function (url, callParams) {
    const { _consumerKey, _consumerSecret } = this;

    return new Promise(function (resolve, reject) {
        const params = {
            /* eslint-disable camelcase */
            ...callParams,
            oauth_consumer_key: _consumerKey,
            oauth_version: "1.0",
            oauth_signature_method: "HMAC-SHA1",
            oauth_timestamp: (Date.now() / 1000).toFixed(),
            oauth_nonce: Math.random()
                .toString(36)
                .replace(/[^a-z]/, "")
                .substr(2),
            /* eslint-enable camelcase */
        };

        const paramsBaseString = Object.keys(params)
            .sort()
            .reduce((prev, el) => `${prev}&${el}=${params[el]}`, "")
            .substr(1);

        const signatureBaseString = ["POST", url, paramsBaseString]
            .map(encodeURIComponent)
            .join("&");

        const signingKey = `${encodeURIComponent(_consumerSecret)}&`;

        const oauthSignatureSha1 = HmacSHA1(signatureBaseString, signingKey);
        const oauthSignatureBase64 = enc.Base64.stringify(oauthSignatureSha1);
        const oauthSignature = encodeURIComponent(oauthSignatureBase64);

        const finalParams = {
            /* eslint-disable camelcase */
            ...params,
            oauth_signature: oauthSignature,
            /* eslint-enable camelcase */
        };

        const signature = Object.keys(finalParams)
            .sort()
            .reduce((prev, el) => (prev += `,${el}="${finalParams[el]}"`), "")
            .substr(1);

        const options = {
            method: "POST",
            headers: {
                Authorization: `OAuth ${signature}`,
                "Cache-Control": "no-cache",
            },
        };

        let data = "";
        const request = https.request(url, options, function (res) {
            res.on("data", function (chunk) {
                data += chunk;
            });

            res.on("end", function () {
                let parsedData = {};

                try {
                    parsedData = JSON.parse();
                } catch (e) {
                    data.split("&").forEach(function (part) {
                        const [key, value] = part.split("=");
                        parsedData[key] = value;
                    });
                }

                resolve(parsedData);
            });
        });

        request.end();
    });
};

/**
 * Get ads api instance.
 * @return {TwitterBusinessSDK}
 */
TwitterSDK.prototype.ads = function () {
    return this._ads;
};

/**
 * Fetch request token.
 * @param {String} redirectUrl
 * @returns {Promise<any>}
 */
TwitterSDK.prototype.fetchRequestToken = function (redirectUrl) {
    return this._corsFetch(`https://api.twitter.com/oauth/request_token`, {
        /* eslint-disable camelcase */
        oauth_callback: redirectUrl,
        /* eslint-enable camelcase */
    });
};

/**
 * Generate auth url.
 * @param {String} redirectUrl
 * @returns {Promise<any>}
 */
TwitterSDK.prototype.generateAuthUrl = function (token) {
    return `https://api.twitter.com/oauth/authorize?oauth_token=${token}`;
};

/**
 * Fetch access token.
 * @param {String} redirectUrl
 * @returns {Promise<any>}
 */
TwitterSDK.prototype.fetchAccessToken = function (authToken, authVerifier) {
    return this._corsFetch(`https://api.twitter.com/oauth/access_token`, {
        /* eslint-disable camelcase */
        oauth_token: authToken,
        oauth_verifier: authVerifier,
        /* eslint-enable camelcase */
    });
};

/**
 * Get twitter ads api instance.
 * @returns {TwitterBusinessSDK}
 */
TwitterSDK.init = function (
    consumerKey,
    consumerSecret,
    accessToken,
    accessTokenSecret,
    isSandbox = false
) {
    const sdk = new TwitterSDK(
        consumerKey,
        consumerSecret,
        accessToken,
        accessTokenSecret,
        isSandbox
    );

    return sdk.ads();
};

module.exports = {
    TwitterSDK,
};
