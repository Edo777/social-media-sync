const LinkedinApiRequest = require("./LinkedinApiRequest");
const LinkedinBusinessSDK = require("./LinkedinBusinessSDK");

/**
 * LinkedinSDK constructor.
 * @param {String} clientId
 * @param {String} clientSecret
 * @param {String} accessToken
 */
const LinkedinSDK = function (clientId, clientSecret, accessToken = "") {
    this._api = new LinkedinApiRequest(clientId, clientSecret, accessToken);
    this._ads = new LinkedinBusinessSDK(this._api);
};

/**
 * Get access token.
 * @param {any} result
 * @returns {
 *    accessToken: String,
 *    accessExpire: Number,
 *    refreshToken?: String,
 *    refreshExpire?: Number,
 * }
 */
LinkedinSDK.prototype._getAccessToken = async function (result) {
    this._api.setAccessToken(result.access_token);

    const data = {
        accessToken: result.access_token,
        accessExpire: result.expires_in,
    };

    if (result.refresh_token) {
        data.refreshToken = result.refresh_token;
        data.refreshExpire = result.refresh_token_expires_in;
    }

    return data;
};

/**
 * Fetch linkedin access token from login authorization code.
 * @param {String} authCode
 * @param {Strng} redirectUrl
 * @returns {Promise<{
 *    accessToken: String,
 *    accessExpire: Number,
 *    refreshToken?: String,
 *    refreshExpire?: Number,
 * }>}
 */
LinkedinSDK.prototype.fetchAccessToken = async function (authCode, redirectUrl) {
    const result = await this._api.getAccessToken("authorization_code", {
        /* eslint-disable camelcase */
        code: authCode,
        redirect_uri: redirectUrl,
        /* eslint-enable camelcase */
    });

    return this._getAccessToken(result);
};

/**
 * Update access token.
 * @param {String} refreshToken
 * @returns {Promise<{
 *    accessToken: String,
 *    accessExpire: Number,
 *    refreshToken?: String,
 *    refreshExpire?: Number,
 * }>}
 */
LinkedinSDK.prototype.updateAccessToken = async function (refreshToken) {
    const result = await this._api.getAccessToken("refresh_token", {
        /* eslint-disable camelcase */
        refresh_token: refreshToken,
        /* eslint-enable camelcase */
    });

    return this._getAccessToken(result);
};

/**
 * Get linkedin logged user info.
 * @returns {Promise<{ id: String, firstName: String, lastname: String }>}
 */
LinkedinSDK.prototype.getUserInfo = async function () {
    const result = await this._api.get("/me?projection=(id,firstName,lastName)");
    const get = function (key) {
        const { country, language } = result[key].preferredLocale;
        const locale = `${language}_${country}`;

        return result[key].localized[locale];
    };

    return {
        id: result.id,
        firstName: get("firstName"),
        lastName: get("lastName"),
    };
};

/**
 * Get linkedin ads api instance.
 * @returns {LinkedinBusinessSDK}
 */
LinkedinSDK.prototype.ads = function () {
    return this._ads;
};

module.exports = {
    LinkedinSDK,
};
