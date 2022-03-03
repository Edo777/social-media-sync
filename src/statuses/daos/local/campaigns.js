"use strict";

const { SocialAds, SocialCampaigns, SocialAdAccounts, Sequelize } = require("../../shared/database/models");
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
 * Get campaigns created in facebook and ready to get statuses
 * @returns {[object]}
 */
async function getFacebookCampaignsForStatusSync() {
    return await _getMany(SocialCampaigns, {
        facebookIsActive: true,
        facebookUserId : {[ne] : null}, 
        facebookId: {[ne] : null}
    }, { 
        attributes: ["id", "facebookId" , "facebookAdAccountId", "facebookAdAccountOwnerId", "facebookUserId"] ,
        include: {
            model: SocialAds,
            as: "ads",
            where: { 
                isActive: true, 
                remoteAdId:  { [ne] : null },
                status: "active"
            },
            required: true,
            attributes: ["remoteAdId", "effectiveStatus"]
        }
    });
}

module.exports = {
    getFacebookCampaignsForStatusSync,
};
