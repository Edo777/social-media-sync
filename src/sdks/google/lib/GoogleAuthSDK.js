const GoogleApis = require("googleapis").google;
const https = require("https");

/**
 * GoogleAuthSDK constructor.
 * @param {String} clientId
 * @param {String} clientSecret
 * @param {String} accessToken
 * @param {String} refreshToken
 */
const GoogleAuthSDK = function (clientId, clientSecret, accessToken = "", refreshToken = "") {
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
};

GoogleAuthSDK.prototype._makeClient = function (redirectUrl) {
    const args = [this._clientId, this._clientSecret];
    if (redirectUrl) {
        args.push(redirectUrl);
    }

    return new GoogleApis.auth.OAuth2(...args);
};

GoogleAuthSDK.prototype._onTokenReceive = function (result) {
    const now = Date.now();
    const end = result.tokens.expiry_date || now;

    const expiresSec = (end - now) / 1000;
    this._accessToken = result.tokens.access_token;
    if (result.tokens.refresh_token) {
        this._refreshToken = result.tokens.refresh_token;
    }

    return {
        refreshToken: result.tokens.refresh_token || null,
        accessToken: result.tokens.access_token,
        idToken: result.tokens.id_token,
        expiresIn: parseInt(expiresSec),
    };
};

/**
 * Set access token.
 * @param {String} accessToken
 */
GoogleAuthSDK.prototype.setAccessToken = function (accessToken) {
    this._accessToken = accessToken;
};

/**
 * Set refresh token.
 * @param {String} refreshToken
 */
GoogleAuthSDK.prototype.setRefreshToken = function (refreshToken) {
    this._refreshToken = refreshToken;
};

/**
 * Get google oauth2 url.
 * @param {any} params
 * @returns {string}
 */
GoogleAuthSDK.prototype.generateAuthUrl = async function (params) {
    const client = this._makeClient(params.redirect_uri);
    return client.generateAuthUrl({
        /* eslint-disable camelcase */
        access_type: "offline",
        include_granted_scopes: true,
        response_type: "code",
        scope: params.scopes,
        /* eslint-enable camelcase */
    });
};

/**
 * Fetch access token and refresh token.
 * @param {any} params
 * @returns {Promise<any>}
 */
GoogleAuthSDK.prototype.fetchAccessToken = async function (params) {
    const result = await this._makeClient(params.redirect_uri).getToken(params.code);
    return this._onTokenReceive(result);
};

/**
 * Update access token using refresh token.
 * @returns {Promise<any>}
 */
GoogleAuthSDK.prototype.updateAccessToken = async function () {
    const result = await this._makeClient().refreshTokenNoCache(this._refreshToken);
    return this._onTokenReceive(result);
};

/**
 * Revoke tokens.
 * @returns {Promise<void>}
 */
GoogleAuthSDK.prototype.revokeToken = async function (accessToken = "") {
    const token = this._accessToken || accessToken;
    return await this._makeClient().revokeToken(token);
};

/**
 * Set new access token.
 * @param {String} token
 */
GoogleAuthSDK.prototype.setAccessToken = function (accessToken) {
    this._accessToken = accessToken;
};

/**
 * Update logged user info.
 * @param {string} accessToken
 * @returns {Promise<null | any>}
 */
GoogleAuthSDK.prototype.getUserInfo = async function (accessToken = "") {
    const result = await this._makeClient().getTokenInfo(this._accessToken || accessToken);
    return {
        id: result.user_id || result.sub,
        email: result.email,
    };
};

/**
 * Update logged user info.
 * @returns {Promise<null | any>}
 */
GoogleAuthSDK.prototype.getProfilePicture = function (googleUserId) {
    const onReady = function (response, resolve, reject) {
        let coverPhoto = "";
        let profilePhoto = "";

        try {
            profilePhoto = response["photos"][0].url;
            coverPhoto = response["coverPhotos"][0].url;
        } catch (e) {}

        // resolve({
        //   profile: profilePhoto,
        //   cover: coverPhoto,
        // });

        resolve(profilePhoto);
    };

    const fields = ["photos", "coverPhotos"];
    const queryParams = [`personFields=${fields.join(",")}`, `access_token=${this._accessToken}`];

    const urlBase = `https://people.googleapis.com/v1/people/${googleUserId}`;
    const url = `${urlBase}?${queryParams.join("&")}`;

    return new Promise(function (resolve, reject) {
        let data = "";
        https
            .request(url, function (res) {
                res.on("data", function (chunk) {
                    data += chunk;
                });

                res.on("end", function () {
                    onReady(JSON.parse(data), resolve, reject);
                });
            })
            .end();
    });
};

module.exports = GoogleAuthSDK;
