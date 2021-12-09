const TiktokApiRequest = require("./TiktokApiRequest");
const TiktokBusinessSDK = require("./TiktokBusinessSDK");

/**
 * TiktokSDK constructor.
 * @param {String} appId
 * @param {String} secret
 * @param {String} accessToken
 */
const TiktokSDK = function (appId, secret, accessToken = "") {
    this._api = new TiktokApiRequest(appId, secret, accessToken);
    this._ads = new TiktokBusinessSDK(this._api);
};

/**
 * Fetch tik-tok access token from login authorization code.
 * @param {String} authCode
 * @param {Strng} redirectUrl
 * @returns {Promise<{
 *    accessToken: String,
 *    accessExpire: Number,
 *    refreshToken?: String,
 *    refreshExpire?: Number,
 * }>}
 */
TiktokSDK.prototype.fetchAccessToken = async function (authCode) {
    const result = await this._api.getAccessToken(authCode);
    this._api.setAccessToken(result.access_token);

    return {
        accessToken: result.access_token,
        scope: result.scope,
        advertisers: result.advertiser_ids,
    };
};

/**
 * Get tik-tok logged user info.
 * @returns {Promise<{ id: String, displayName: String }>}
 */
TiktokSDK.prototype.getUserInfo = async function () {
    const result = await this._api.get("/user/info");

    return {
        id: result.data.id,
        displayname: result.data.display_name,
    };
};

/**
 * Get tik-tok ads api instance.
 * @returns {TiktokBusinessSDK}
 */
TiktokSDK.prototype.ads = function () {
    return this._ads;
};

module.exports = {
    TiktokSDK,
};
