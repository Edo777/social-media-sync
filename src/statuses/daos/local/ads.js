"use strict";

const { SocialAds, SocialCampaigns, SocialAdAccounts , Sequelize} = require("../../shared/database/models");
const {ne} = Sequelize.Op;

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
 * Get many
 * @param {SequelizeModel} model
 * @param {object} condition
 * @param {{attributes, include}} options
 * @returns
 */
async function _getMany(model, condition, options) {
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
 * Update Ads
 * @param {any} model 
 * @param {object} data 
 * @param {object} condition 
 * @returns 
 */
async function _update(data, condition) {
    const updateOptions = { where: condition };

    return await SocialAds.update(data, updateOptions);
}

/**
 * Get campaigns-ads-adgroups created in google and ready to get statuses
 * @returns {[object]}
 */
 async function getGoogleAdsForStatusSync() {
     const condition = {
        isActive: true,
        remoteAdId: {[ne] : null},
        googleCampaignId : {[ne] : null}, 
        googleAdgroupId: {[ne] : null}
    };

    const options = {
        attributes: [
            "id",  
            "remoteAdId", 
            "googleCampaignId" , 
            "googleAdgroupId", 
            "loginCustomerId", 
            "clientCustomerId", 
            "facebookUserId"
        ]
    };

    return await _getMany(SocialAds, condition , options);
}

module.exports = {
    _update,
    getGoogleAdsForStatusSync
};
