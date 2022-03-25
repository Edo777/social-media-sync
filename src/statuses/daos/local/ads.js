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
        // status: "active",
        // effectiveStatus: ["active", "pending", "pending_billing_info", "pending_review"],
        googleCampaignId : {[ne] : null}, 
        googleAdgroupId: {[ne] : null}
    };

    const options = {
        attributes: [
            "id",  
            "adAccountOwnerId",
            "remoteAdId", 
            "googleCampaignId" , 
            "googleAdgroupId", 
            "loginCustomerId", 
            "clientCustomerId",
            "remoteUserId"
        ]
    };

    return await _getMany(SocialAds, condition , options);
}

/**
 * Get ads created in facebook and ready to get statuses
 * @returns {[object]}
 */
 async function getFacebookAdsForStatusSync() {
    return await _getMany(SocialAds, { 
        isActive: true, 
        provider: ["facebook", "instagram"],
        remoteAdId:  { [ne] : null },
        status: "active"
    }, {
        attributes: ["id", "remoteAdId", "remoteUserId", "effectiveStatus", "status"],
        include: {
            model: SocialAdAccounts,
            as : "adAccount",
            where : { disableReason: "NONE" },
            required: true,
            attributes: ["adAccountId"]
        }
    });
}

module.exports = {
    _update,
    getGoogleAdsForStatusSync,
    getFacebookAdsForStatusSync
};
