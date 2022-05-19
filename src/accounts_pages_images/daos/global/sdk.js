const { FacebookSDK, GoogleSDK, LinkedinSDK, TiktokSDK, TwitterSDK } = require("../../../sdks");
const { SocialAccessTokens } = require("../../shared/database/models");

const {
    SOCIAL_MEDIA_FACEBOOK_APP_ID,
    SOCIAL_MEDIA_FACEBOOK_APP_SECRET,
    SOCIAL_MEDIA_LINKEDIN_CLIENT_ID,
    SOCIAL_MEDIA_LINKEDIN_CLIENT_SECRET,
    SOCIAL_MEDIA_TIKTOK_APP_ID,
    SOCIAL_MEDIA_TIKTOK_SECRET,
    SOCIAL_MEDIA_TWITTER_CONSUMER_KEY,
    SOCIAL_MEDIA_TWITTER_CONSUMER_SECRET,
    SOCIAL_MEDIA_TWITTER_BEARER_TOKEN,
    SOCIAL_MEDIA_GOOGLE_CLIENT_ID,
    SOCIAL_MEDIA_GOOGLE_CLIENT_SECRET,
    SOCIAL_MEDIA_GOOGLE_DEVELOPER_TOKEN,
} = process.env;

/**
 * Get by spec condition
 * @param {SequelizeModel} model
 * @param {object} condition
 * @param {{attributes, include}} options
 * @returns
 */
 async function _get(model, condition, options = null) {
    const findOptions = { where: condition };

    // attributes
    if (options && options["attributes"]) {
        findOptions["attributes"] = options["attributes"];
    }

    // includes
    if (options && options.include) {
        findOptions.include = options.include;
    }

    return await model.findOne(findOptions);
}

/**
 * Get by spec condition
 * @param {SequelizeModel} model
 * @param {object} condition
 * @param {{attributes, include}} options
 * @returns
 */
 async function _getMany(model, condition, options = null) {
    const findOptions = { where: condition };

    // attributes
    if (options && options["attributes"]) {
        findOptions["attributes"] = options["attributes"];
    }

    // includes
    if (options && options.include) {
        findOptions.include = options.include;
    }

    return await model.findAll(findOptions);
}

/**
 * Get access tokens row
 * @param {Number} userId
 * @return {Promise<{status : "success" | "failed", result : any}>}
 */
 async function getAccessTokensRow(userId) {
    let accessTokenRow = await _get(SocialAccessTokens, { userId: userId });

    if(!accessTokenRow) {
        return {status: "failed", result : "sdk doesnt exists"};
    }

    return {status : "success", result: accessTokenRow}
};

/**
 * Get access tokens row by remote user id
 * @param {number | string} userId
 * @return {Promise<{status : "success" | "failed", result : any}>}
 */
 async function getAccessTokensRowByRemoteUserId(userId, platform, attributes=[]) {
    const condition = { [`${platform}UserId`]: userId, [`${platform}IsLogged`]: true};
    const options = { attributes: ["id", `${platform}AccessToken`, `${platform}UserId`] };

    if(attributes && attributes.length) {
        options.attributes = Array.from(new Set([...options.attributes, ...attributes]));
    }
    
    let accessTokenRow = await _get(SocialAccessTokens, condition, options);

    if(!accessTokenRow) {
        return {status: "failed", result : "sdk doesnt exists"};
    }

    return {status : "success", result: accessTokenRow}
};

/**
 * Get access tokens
 * @param {{
 *  attributes: [string],
 *  condition: object
 * }} options 
 */
async function getAccessTokensByCondition(options) {
    if(!options || !options.attributes || !options.condition) {
        return [];
    }

    return await _getMany(SocialAccessTokens, 
        options.condition, 
        { attributes: options.attributes }
    );
}

/**
 * Get sdk instance.
 * @param {"facebook"|"instagram"|"twitter"|"tiktok"|"linkedin"|"google"} provider
 * @param {number|null} userId
 * @returns {FacebookSDK|LinkedinSDK|TwitterSDK|TiktokSDK}
 * @throws
 */
async function getSdkInstance(provider, userId = null) {
    let authData = {};
    if (null != userId) {
        const tokensData = await getAccessTokensRow(userId);

        if(tokensData.status === "success") {
            authData = tokensData.result;
        }
    }

    let sdkInstance = null;
    switch (provider) {
        case "facebook":
        case "instagram":
            sdkInstance = new FacebookSDK(
                SOCIAL_MEDIA_FACEBOOK_APP_ID,
                SOCIAL_MEDIA_FACEBOOK_APP_SECRET,
                authData.facebookAccessToken || ""
            );
            break;

        case "linkedin":
            sdkInstance = new LinkedinSDK(
                SOCIAL_MEDIA_LINKEDIN_CLIENT_ID,
                SOCIAL_MEDIA_LINKEDIN_CLIENT_SECRET,
                authData.linkedinAccessToken || ""
            );
            break;

        case "tiktok":
            sdkInstance = new TiktokSDK(
                SOCIAL_MEDIA_TIKTOK_APP_ID,
                SOCIAL_MEDIA_TIKTOK_SECRET,
                authData.tiktokAccessToken || ""
            );
            break;

        case "twitter":
            sdkInstance = new TwitterSDK(
                SOCIAL_MEDIA_TWITTER_CONSUMER_KEY,
                SOCIAL_MEDIA_TWITTER_CONSUMER_SECRET,
                authData.twitterAccessToken || "",
                authData.twitterAccessSecret || ""
            );
            break;

        case "youtube":
        case "google":
        case "google-appinstall":
        case "google-search":
        case "google-image":
        case "google-display":
            sdkInstance = new GoogleSDK({
                clientId: SOCIAL_MEDIA_GOOGLE_CLIENT_ID,
                clientSecret: SOCIAL_MEDIA_GOOGLE_CLIENT_SECRET,
                developerToken: SOCIAL_MEDIA_GOOGLE_DEVELOPER_TOKEN,
                accessToken: authData.googleAccessToken || "",
                refreshToken: authData.googleRefreshToken || "",
                pythonShellLogging: process.isProd ? !process.isProd() : true,
            });
            break;
    }

    if (null != sdkInstance) {
        sdkInstance.authData = { ...authData.dataValues };
        return sdkInstance;
    }

    throw new Error(`Unknown SDK provider: ${provider}`);
};

/**
 * Get sdk instance.
 * @param {"facebook"|"instagram"|"twitter"|"tiktok"|"linkedin"|"google"} provider
 * @param {number|null} userId
 * @returns {FacebookSDK|LinkedinSDK|TwitterSDK|TiktokSDK}
 * @throws
 */
 async function getSdkInstanceByRemoteUser(provider, remoteUserId, attributes = null) {
    let authData = {};
    if (null != remoteUserId) {
        const tokensData  = await getAccessTokensRowByRemoteUserId(remoteUserId, provider, attributes);

        if(tokensData.status === "success") {
            authData = tokensData.result;
        }
    }

    let sdkInstance = null;
    switch (provider) {
        case "facebook":
        case "instagram":
            sdkInstance = new FacebookSDK(
                SOCIAL_MEDIA_FACEBOOK_APP_ID,
                SOCIAL_MEDIA_FACEBOOK_APP_SECRET,
                authData.facebookAccessToken || ""
            );
            break;

        case "linkedin":
            sdkInstance = new LinkedinSDK(
                SOCIAL_MEDIA_LINKEDIN_CLIENT_ID,
                SOCIAL_MEDIA_LINKEDIN_CLIENT_SECRET,
                authData.linkedinAccessToken || ""
            );
            break;

        case "tiktok":
            sdkInstance = new TiktokSDK(
                SOCIAL_MEDIA_TIKTOK_APP_ID,
                SOCIAL_MEDIA_TIKTOK_SECRET,
                authData.tiktokAccessToken || ""
            );
            break;

        case "twitter":
            sdkInstance = new TwitterSDK(
                SOCIAL_MEDIA_TWITTER_CONSUMER_KEY,
                SOCIAL_MEDIA_TWITTER_CONSUMER_SECRET,
                authData.twitterAccessToken || "",
                authData.twitterAccessSecret || ""
            );
            break;

        case "youtube":
        case "google":
        case "google-appinstall":
        case "google-search":
        case "google-image":
        case "google-display":
            sdkInstance = new GoogleSDK({
                clientId: SOCIAL_MEDIA_GOOGLE_CLIENT_ID,
                clientSecret: SOCIAL_MEDIA_GOOGLE_CLIENT_SECRET,
                developerToken: SOCIAL_MEDIA_GOOGLE_DEVELOPER_TOKEN,
                accessToken: authData.googleAccessToken || "",
                refreshToken: authData.googleRefreshToken || "",
                pythonShellLogging: process.isProd ? !process.isProd() : true,
            });
            break;
    }

    if (null != sdkInstance) {
        sdkInstance.authData = { ...authData.dataValues };
        return sdkInstance;
    }

    throw new Error(`Unknown SDK provider: ${provider}`);
};

/**
 * @param {"facebook"|"instagram"|"twitter"|"tiktok"|"linkedin"|"google"} provider
 * @param {{
 *  accessToken: string,
 *  accessSecret: string,
 *  refreshToken: string
 * }} data 
 */
async function getSdkByNeededData(provider, data) {
    let sdkInstance = null;

    switch (provider) {
        case "facebook":
        case "instagram":
            sdkInstance = new FacebookSDK(
                SOCIAL_MEDIA_FACEBOOK_APP_ID,
                SOCIAL_MEDIA_FACEBOOK_APP_SECRET,
                data.accessToken || ""
            );
            break;

        case "linkedin":
            sdkInstance = new LinkedinSDK(
                SOCIAL_MEDIA_LINKEDIN_CLIENT_ID,
                SOCIAL_MEDIA_LINKEDIN_CLIENT_SECRET,
                data.accessToken || ""
            );
            break;

        case "tiktok":
            sdkInstance = new TiktokSDK(
                SOCIAL_MEDIA_TIKTOK_APP_ID,
                SOCIAL_MEDIA_TIKTOK_SECRET,
                data.accessToken || ""
            );
            break;

        case "twitter":
            sdkInstance = new TwitterSDK(
                SOCIAL_MEDIA_TWITTER_CONSUMER_KEY,
                SOCIAL_MEDIA_TWITTER_CONSUMER_SECRET,
                data.accessToken || "",
                data.accessSecret || ""
            );
            break;

        case "youtube":
        case "google":
        case "google-appinstall":
        case "google-search":
        case "google-image":
        case "google-display":
            sdkInstance = new GoogleSDK({
                clientId: SOCIAL_MEDIA_GOOGLE_CLIENT_ID,
                clientSecret: SOCIAL_MEDIA_GOOGLE_CLIENT_SECRET,
                developerToken: SOCIAL_MEDIA_GOOGLE_DEVELOPER_TOKEN,
                accessToken: data.accessToken || "",
                refreshToken: data.refreshToken || "",
                pythonShellLogging: process.isProd ? !process.isProd() : true,
            });
            break;
    }
    
    return sdkInstance;
}

module.exports = {
    getSdkByPlatform: getSdkInstance,
    getSdkByRemoteUser: getSdkInstanceByRemoteUser,
    getSdkByNeededData,
    getAccessTokensByCondition
};
