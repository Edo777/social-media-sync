const FacebookBusinessSDK = require("./FacebookBusinessSDK");

/**
 * FacebookSDK constructor.
 * @param {String} appId
 * @param {String} appSecret
 * @param {String} accessToken
 */
const FacebookSDK = function (appId, appSecret, accessToken) {
    this._appId = appId;
    this._appSecret = appSecret;

    this._api = new FacebookBusinessSDK.FacebookAdsApi(accessToken, "en_US");
    const defaultApi = FacebookBusinessSDK.FacebookAdsApi.getDefaultApi();

    if (!defaultApi) {
        FacebookBusinessSDK.FacebookAdsApi.setDefaultApi(this._api);
    }

    this._apiBatch = new FacebookBusinessSDK.FacebookAdsApiBatch(this._api);
};

/**
 * Get facebook app id.
 * @returns {String}
 */
FacebookSDK.prototype.getAppId = function () {
    return this._appId;
};

/**
 * Get facebook app secret.
 * @returns {String}
 */
FacebookSDK.prototype.getAppSecret = function () {
    return this._appSecret;
};

/**
 * Get api instance.
 * @returns {FacebookBusinessSDK.FacebookAdsApi}
 */
FacebookSDK.prototype.api = function () {
    return this._api;
};

/**
 * Get api instance.
 * @returns {FacebookBusinessSDK.FacebookAdsApi}
 */
FacebookSDK.prototype.apiBatch = function () {
    return this._apiBatch;
};

/**
 * Make api child type instance.
 * @param {any} instanceType
 * @param {any} args
 * @returns {any}
 */
FacebookSDK.prototype.instance = function (instanceType, args = {}) {
    return new instanceType(args.id || null, args.data || {}, args.parentId || null, this._api);
};

/**
 * Update access token.
 * @param {any} params
 * @returns {Promise<any>}
 */
FacebookSDK.prototype.updateAccessToken = function (params) {
    return this._api.call("GET", ["oauth/access_token"], params);
};

/**
 * validate access token.
 * @param {any} params
 * @returns {Promise<any>}
 */
FacebookSDK.prototype.validateAccessToken = function (params) {
    return this._api.call("GET", ["me"], params);
};

/**
 * Get something by id
 * @param {number | string} resourceId
 * @param {object} params
 * @returns
 */
FacebookSDK.prototype.getResource = function (resourceId, params) {
    return this._api.call("GET", [resourceId.toString()], params);
};

/**
 * Get mobile application info by store url.
 * @param {String} accountId
 * @param {"google_play" | "itunes" | "itunes_ipad" | "windows_10_store" | "fb_canvas" | "amazon_app_store"} storeType
 * @param {String} storeUrl
 * @returns {Promise<{ id: Number, name: String, icon: String }>}
 */
FacebookSDK.prototype.getMobileAppInfoByUrl = async function (accountId, storeType, storeUrl) {
    const response1 = await this._api.call("GET", [`${accountId}/matched_search_applications`], {
        /* eslint-disable camelcase */
        app_store: storeType,
        query_term: storeUrl,
        /* eslint-enble camelcase */
    });

    if (!response1 || !response1.data || !response1.data[0]) {
        throw new Error("Could not load application id.");
    }

    const result1 = response1.data[0];
    if (result1.app_id) {
        return {
            name: result1.name,
            icon: result1.icon_url,
            id: result1.app_id,
        };
    }

    const response2 = await this._api.call("GET", ["search"], {
        /* eslint-disable camelcase */
        type: "addestination",
        object_url: storeUrl,
        /* eslint-enble camelcase */
    });

    if (!response2 || !response2.data || !response2.data[0]) {
        throw new Error("Could not load application id.");
    }

    const result2 = response2.data[0];
    return {
        name: result2.name,
        icon: result2.picture,
        id: result2.id,
    };
};

/**
 * Get object picture.
 * @param {Number} objectId
 * @returns {Promise<String>}
 */
FacebookSDK.prototype.getPicture = async function (objectId) {
    const respnse = await this._api.call("GET", [`${objectId}/picture`], { redirect: 0 });
    if (respnse && respnse.data && respnse.data.url) {
        return respnse.data.url;
    }

    return "";
};

const paramsGetInstagram = {
    fields: ["id", "username", "profile_pic", "has_profile_picture"].join(","),
};

/**
 * Get page backed instagram accounts
 * @param {Number} pageId
 * @returns {Promise<any[]>}
 */
FacebookSDK.prototype.getPageBackedInstagramAccounts = async function (pageId) {
    const respnse = await this._api.call(
        "GET",
        [`${pageId}/page_backed_instagram_accounts`],
        paramsGetInstagram
    );

    if (respnse && respnse.data && respnse.data.length > 0) {
        return respnse.data;
    }

    return [];
};

/**
 * Get connected instagram accounts
 * @param {Number} pageId
 * @returns {Promise<any[]>}
 */
FacebookSDK.prototype.getConnectedInstagramAccounts = async function (pageId) {
    const respnse = await this._api.call(
        "GET",
        [`${pageId}/instagram_accounts`],
        paramsGetInstagram
    );

    if (respnse && respnse.data && respnse.data.length > 0) {
        return respnse.data;
    }

    return [];
};

FacebookBusinessSDK.FacebookSDK = FacebookSDK;
module.exports = FacebookBusinessSDK;
