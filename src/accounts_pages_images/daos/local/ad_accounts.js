"use strict";

const { SocialAdAccounts, SocialAssoAdaccountsWorkspaces, Sequelize} = require("../../shared/database/models");
const _ = require("lodash");

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
 * Update accounts
 * @param {object} data 
 * @param {object} condition 
 * @returns 
 */
 async function _update(data, condition) {
    const updateOptions = { where: condition };

    return await SocialAdAccounts.update(data, updateOptions);
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
 * Load ad accounts which have need to load images
 * !!! Only accounts whcih connected some workspace
 * @param { "facebook" | "google" } platform 
 * @returns {Promise<array>}
 */
async function loadAccountsNeededImagesLoad(platform) {
    let adAccounts = await _getMany(SocialAdAccounts, {
        platform: platform,
        adAccountIcon: "not-loaded",
        userVisible: true,
    }, {
        attribute: ["id", "adAccountOwnerId", "adAccountIcon", "platformUserId", "adAccountId"],
    });

    if(adAccounts.length){
        const ids = adAccounts.map(a => a.id);
        
        const associations = await _getMany(
            SocialAssoAdaccountsWorkspaces, 
            { adAccountId: ids }, 
            { attributes: ["id", "adAccountId"] }
        );

        if(!associations.length){
            adAccounts = [];
        }else{
            const neededIds = associations.map(a => a.adAccountId);

            adAccounts = adAccounts.filter(acc => neededIds.includes(acc.id));
        }
    }

    return adAccounts;
}

/**
 * Set ad accounts icons to database
 * @param {[{ 
 *  id: number, 
 *  adAccountIcon: string, 
 *  adAccountId: string,
 *  adAccountOwnerId: string
 * }]} adAccounts 
 * @returns 
 */
async function setAdAccountsImagesToDatabase(adAccounts){
    if(adAccounts && adAccounts.length) {
        const groupedAdAccounts = _.groupBy(adAccounts, 'adAccountOwnerId');

        const promises = [];
    
        Object.keys(groupedAdAccounts).forEach((ownerId) => {
            const localIds = groupedAdAccounts[ownerId].map(a => a.id);
            const adAccountIcon = groupedAdAccounts[ownerId][0].adAccountIcon;
    
            promises.push(_update({ adAccountIcon }, { id: localIds }));
        });
    
        const promiseChunks = _.chunk(promises, 5);
        for(const promiseChunk of promiseChunks) {
            await Promise.allSettled(promiseChunk);
        }
    }

    return { status: "success" };
}

module.exports = {
    loadAccountsNeededImagesLoad,
    setAdAccountsImagesToDatabase
};
