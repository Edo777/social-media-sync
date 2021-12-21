const GoogleAuthSDK = require("./GoogleAuthSDK");
const GoogleBusinessSDK = require("./GoogleBusinessSDK");
const helpers = require("../defines/helpers");
const enums = require("../defines/enums");

const parseCustomerId = function (str) {
    return helpers.parseCustomerId(str || "", "s");
};

/**
 * GoogleSDK constructor.
 * @param {GoogleSDKInitParam} configs
 */
const GoogleSDK = function (configs) {
    const configsClone = JSON.parse(JSON.stringify(configs));
    configsClone.loginCustomerId = parseCustomerId(configsClone.loginCustomerId);
    configsClone.clientCustomerId = parseCustomerId(configsClone.clientCustomerId);

    this._clientId = configsClone.clientId;
    this._clientSecret = configsClone.clientSecret;
    this._developerToken = configsClone.developerToken;
    this._loginCustomerId = configsClone.loginCustomerId;
    this._accessToken = configsClone.accessToken;
    this._refreshToken = configsClone.refreshToken;
    this._clientCustomerId = configsClone.clientCustomerId;
    this._pythonShellLogging = configsClone.pythonShellLogging;

    this._auth = new GoogleAuthSDK(
        this._clientId,
        this._clientSecret,
        this._accessToken,
        this._refreshToken
    );

    this._api = GoogleBusinessSDK.init(
        this,
        this._clientId,
        this._clientSecret,
        this._developerToken,
        this._loginCustomerId,
        this._accessToken,
        this._refreshToken,
        this._clientCustomerId,
        this._pythonShellLogging
    );
};

/**
 * Set login customer id.
 * @param {String} loginCustomerId
 */
GoogleSDK.prototype.setLoginCustomerId = function (loginCustomerId) {
    this._loginCustomerId = parseCustomerId(loginCustomerId);
    this._api.setLoginCustomerId(this._loginCustomerId);
};

/**
 * Set client customer id.
 * @param {String} loginCustomerId
 */
GoogleSDK.prototype.setClientCustomerId = function (clientCustomerId) {
    this._clientCustomerId = parseCustomerId(clientCustomerId);
    this._api.setClientCustomerId(this._clientCustomerId);
};

/**
 * Set access token.
 * @param {String} accessToken
 */
GoogleSDK.prototype.setAccessToken = function (accessToken) {
    this._accessToken = accessToken;
    this._auth.setAccessToken(accessToken);

    if (null != this._api) {
        this._api.setAccessToken(accessToken);
    }
};

/**
 * Set refresh token.
 * @param {String} refreshToken
 */
GoogleSDK.prototype.setRefreshToken = function (refreshToken) {
    this._refreshToken = refreshToken;
    this._auth.setRefreshToken(refreshToken);

    if (null != this._api) {
        this._api.setRefreshToken(refreshToken);
    }
};

/**
 * Generate google login url.
 * @param {string} redirectUrl
 * @param {{permissions: [string], loginHint: string}} param2
 */
GoogleSDK.prototype.generateAuthUrl = function (redirectUrl, { permissions, loginHint }) {
    return this._auth.generateAuthUrl({
        /* eslint-disable camelcase */
        redirect_uri: redirectUrl,
        scopes: permissions,
        login_hint: loginHint,
        /* eslint-enable camelcase */
    });
};

/**
 * Fetch google access token from login authorization code.
 * @param {String} authCode
 * @param {Strng} redirectUrl
 * @returns {Promise<{
 *    accessToken: String,
 *    accessExpire: Number,
 *    refreshToken?: String,
 *    refreshExpire?: Number,
 * }>}
 */
GoogleSDK.prototype.fetchAccessToken = function (authCode, redirectUrl) {
    return this._auth.fetchAccessToken({
        /* eslint-disable camelcase */
        code: authCode,
        redirect_uri: redirectUrl,
        /* eslint-enable camelcase */
    });
};

/**
 * Update access token using refresh token.
 * @returns {Promise<any>}
 */
GoogleSDK.prototype.updateAccessToken = function () {
    return this._auth.updateAccessToken();
};

/**
 * Get logged user info.
 * @param {string} accessToken
 * @returns {Promise<any>}
 */
GoogleSDK.prototype.getUserInfo = function (accessToken = "") {
    return this._auth.getUserInfo(accessToken);
};

/**
 * Get logged user profile picture.
 * @returns {Promise<any>}
 */
GoogleSDK.prototype.getPicture = function (ownerId) {
    return this._auth.getProfilePicture(ownerId);
};

/**
 * Revoke user token.
 * @returns {Promise<any>}
 */
GoogleSDK.prototype.revokeToken = function (accessToken = "") {
    return this._auth.revokeToken(accessToken);
};

GoogleSDK.prototype.helpers = GoogleSDK.prototype.helpers || {};
GoogleSDK.helpers = GoogleSDK.helpers || {};
Object.keys(helpers).forEach(function (helperName) {
    GoogleSDK.prototype.helpers[helperName] = helpers[helperName];
    GoogleSDK.helpers[helperName] = helpers[helperName];
});

GoogleSDK.prototype.enums = GoogleSDK.prototype.enums || {};
GoogleSDK.enums = GoogleSDK.enums || {};
Object.keys(enums).forEach(function (enumName) {
    GoogleSDK.prototype.enums[enumName] = enums[enumName];
    GoogleSDK.enums[enumName] = enums[enumName];
});

module.exports = { GoogleSDK };
