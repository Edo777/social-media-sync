"use strict";

const { SocialPages, SocialAssoPagesWorkspaces } = require("../../shared/database/models");
const { executePromisesWithChunks } = require("../../utils")
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
 * Update pages
 * @param {object} data 
 * @param {object} condition 
 * @returns 
 */
 async function _update(data, condition) {
    const updateOptions = { where: condition };

    return await SocialPages.update(data, updateOptions);
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
 * Filter and return only associated pages
 * @param {[{id: number, pageId: string}]} pages 
 * @returns 
 */
async function filterAssociatedPages(pages) {
    if(pages && pages.length){
        const ids = pages.map(a => a.id);
        
        const associations = await _getMany(
            SocialAssoPagesWorkspaces, 
            { pageId: ids },
            { attributes: ["id", "pageId"] }
        );

        if(!associations.length){
            pages = [];
        }else{
            const neededIds = associations.map(a => a.pageId);

            pages = pages.filter(pg => neededIds.includes(pg.id));
        }
    }
   
    return pages;
}

/**
 * Load pages which have need to load images
 * !!! Only pages which connected some workspace
 * @param { "facebook" | "google" } platform 
 * @param {boolean} filterAssociated
 * @returns {Promise<array>}
 */
async function loadPagesNeededImagesLoad(platform, filterAssociated=true) {
    let pages = await _getMany(SocialPages, {
        platform: platform,
        pageIcon: "not-loaded",
        userVisible: true,
    }, {
        attribute: ["id", "pageId", "pageIcon", "platformUserId"],
    });

    if(filterAssociated && pages.length){
        pages = await filterAssociatedPages(pages);
    }

    return pages;
}

/**
 * Load pages which have need to load info
 * !!! Only pages whcih connected some workspace
 * @param { "facebook" | "google" } platform 
 * @returns {Promise<array>}
 */
 async function loadPagesNeededInfoLoad(platform, filterAssociated=true) {
    let pages = await _getMany(SocialPages, {
        platform: platform,
        userVisible: true,
    }, {
        attribute: ["id", "userId", "platformUserId", "pageId", "promotionEligible", "promotionIneligibleReason"],
    });

    if(filterAssociated && pages.length){
        pages = await filterAssociatedPages(pages);
    }

    return pages;
}

/**
 * Set pages icons to database
 * @param {[{ 
 *  id: number, 
 *  pageIcon: string, 
 *  pageId: string,
 *  platformUserId: string
 * }]} pages 
 * @returns 
 */
async function setPagesImagesToDatabase(pages){
    if(pages && pages.length) {
        const groupedPages = _.groupBy(pages, 'pageId');

        const promises = [];
    
        Object.keys(groupedPages).forEach((pageId) => {
            const localIds = groupedPages[pageId].map(a => a.id);
            const pageIcon = groupedPages[pageId][0].pageIcon;
    
            promises.push(_update({ pageIcon }, { id: localIds }));
        });

        await executePromisesWithChunks(promises, 5);
    }

    return { status: "success" };
}

/**
 * 
 * @param {[{
 *  id: number, 
 *  promotionEligible: string,
 *  promotionIneligibleReason: string
 * }]} pages 
 */
async function setPagesInformationToDatabase(pages) {
    if(pages && pages.length) {
        const groupedPages = _.groupBy(pages, (it) => {
            return `${it.promotionEligible}-${it.promotionIneligibleReason}`;
        });

        const promises = [];
    
        Object.keys(groupedPages).forEach((groupKey) => {
            const { promotionEligible, promotionIneligibleReason } = groupKey.split("-");

            const localIds = groupedPages[groupKey].map(p => p.id);
    
            promises.push(_update({ 
                promotionEligible, 
                promotionIneligibleReason 
            }, { 
                id: localIds 
            }));
        });
    
        await executePromisesWithChunks(promises, 5);
    }

    return { status: "success" };
}

module.exports = {
    loadPagesNeededImagesLoad,
    setPagesImagesToDatabase,

    loadPagesNeededInfoLoad,
    setPagesInformationToDatabase
};
