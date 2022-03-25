const { Sequelize } = require("../../../../shared/database/models");
const { LocalCampaignsDao, LocalAdsDao, FacebookCampaignsDao, LocalApiCallsDao, FacebookAdAccountsDao } = require("../../../../daos");
const { getSdkByPlatform, getSdkByRemoteUser } = require("../../../../daos/global/sdk");
const {EffectiveStatusDetector} = require("../../../../utils");
const _ = require("lodash");
const { or, and } = Sequelize.Op;

/**
 * Get sdk and remote user
 * @param {number} userId
 * @param {any} facebookUserId
 * @returns {{sdk: any, remoteUserId: string}}
 */
async function getSdkParams(userId, facebookUserId = null) {
    const sdk = await getSdkByPlatform("facebook", userId);

    if (!facebookUserId) {
        facebookUserId = sdk["authData"].facebookUserId;
    }

    return { sdk, remoteUserId: facebookUserId };
}

/**
 * Get sdk and remote user
 * @param {number} id
 * @returns {{ sdk: any, remoteUserId: string }}
 */
 async function getSdkParamsByRemoteUser(id) {
    const sdk = await getSdkByRemoteUser("facebook", id);

    return sdk;
}

/**
 * Detect statuses
 * When local and remote ad's statuses will be same, function doesn't return that ad
 * @param {[{id: number, status: string, effective_status: string}]} remoteAds 
 * @param {[{id: number, status: string, effectiveStatus: string, remoteAdId: string}]} localAds 
 * @returns {[{remoteId: number, status: string, effectiveStatus: string}]}
 */
function formatStatuses(remoteAds, localAds) {
    const formattedAds = [];
    for (let i = 0; i < remoteAds.length; i++) {
        const adFromRemote = JSON.parse(JSON.stringify(remoteAds[i]));
        const adFromLocal = localAds.find(ad => ad.remoteAdId.toString() === adFromRemote.id);

        if (adFromLocal && adFromRemote && adFromRemote["effective_status"] && adFromRemote["status"]) {
            const { status, effectiveStatus } = EffectiveStatusDetector.detectFacebook(
                adFromRemote["effective_status"],
                adFromRemote["status"]
            );

            const result = { remoteId: adFromRemote.id, status, effectiveStatus };

            if(adFromLocal["effectiveStatus"] === effectiveStatus && adFromLocal["status"] === status) {
                continue;
            }

            formattedAds.push(result);
        }
    }

    return formattedAds;
}

/**
 * Create api calls predicted count
 * @param {{ [facebookUserId] : [requestsCount] }}
 * @returns 
 */
async function createApiCallsCount(data) {
    for(const remoteId in data) {
        await LocalApiCallsDao.createApiCall(remoteId, {
            count: data[remoteId],
            provider: "facebook"
        })
    }
}

/**
 * Will create array for bulk requests
 * @param {FacebookSDK} sdk 
 * @param {[string]} campaignIds 
 * @returns {[Promise<[object]>]}
 */
function generatePromisesBulkRead(sdk, campaignIds) {
    const requestPromises = []

    if(sdk && campaignIds && campaignIds.length) {
        if(campaignIds.length > 50) {
            const chunkCount = Math.ceil(campaignIds.length / 50);
            const idsChunked = _.chunk(campaignIds, chunkCount);
    
            for(let i = 0; i < idsChunked.length; i++) {
                const dataForequest = [];
                idsChunked[i].forEach((campaignId) => {
                    dataForequest.push({ 
                        campaignId , adFields: ["id", "status", "effective_status"]
                    });
                });
    
                const promise = FacebookCampaignsDao.bulkReadAds(sdk, dataForequest);
                requestPromises.push(promise);
            }
        } else {
            const dataForequest = [];
            campaignIds.forEach((campaignId) => {
                dataForequest.push({ 
                    campaignId , adFields: ["id", "status", "effective_status"]
                });
            });
    
            const promise = FacebookCampaignsDao.bulkReadAds(sdk, dataForequest);
            requestPromises.push(promise);
        }
    }

    return requestPromises;
}

/**
 * Set active the unactive ads and campaigns of logged user
 * @param {number} userId
 * @param {any} remoteUserId
 * @returns {{status :string, result: any}}
 */
async function execute() {
    try {
        const campaigns = await LocalCampaignsDao.getFacebookCampaignsForStatusSync();

        if(!campaigns.length) {
            return { status: "success", result: "success" };
        }

        /**
         * ----------------------------------------------
         * | GENERATE SDK LIST FOR EACH CAMPAIGN's USER |
         * ----------------------------------------------
         */
        const sdksList = {};
        for(let i = 0; i < campaigns.length; i++) {
            const { facebookId, facebookAdAccountOwnerId, ads } = campaigns[i];

            if(!sdksList.hasOwnProperty(facebookAdAccountOwnerId)) {
                sdksList[facebookAdAccountOwnerId] = {
                    sdk: null, 
                    campaignIds: []
                };
            }

            if(!sdksList[facebookAdAccountOwnerId].sdk) {
                try {
                    const {sdk: sdkOfCurrentUser} = await getSdkParams(facebookAdAccountOwnerId);
                    sdksList[facebookAdAccountOwnerId].sdk = sdkOfCurrentUser;
                } catch (error) {
                    continue;
                }
            }

            // Take only active ads
            const filteredAds = ads.filter(filterActiveAd);

            if(filteredAds.length) {
                sdksList[facebookAdAccountOwnerId].campaignIds.push(facebookId);
            }
        }

        if(!Object.keys(sdksList).length) {
            return { status: "success", result: "success" };
        }

        /**
         * ---------------------------------------
         * | GENERATE Promises for bulk requests |
         * ---------------------------------------
         */
        const dataForRequestsCountCalculation  = {};
        const requestPromises = [];
        Object.keys(sdksList).forEach((row) => {
            const {sdk: neededSdk, campaignIds} = sdksList[row];
            const promisesOfBulkRead = generatePromisesBulkRead(neededSdk, campaignIds);

            requestPromises.push(...promisesOfBulkRead);

            // create data for calculate requests count
            if(neededSdk && neededSdk.authData && neededSdk.authData.facebookUserId) {
                if(!dataForRequestsCountCalculation.hasOwnProperty(neededSdk.authData.facebookUserId)) {
                    dataForRequestsCountCalculation[neededSdk.authData.facebookUserId] = campaignIds.length
                }else{
                    dataForRequestsCountCalculation[neededSdk.authData.facebookUserId] += campaignIds.length
                }
            }
        });

        if(!requestPromises.length) {
            return { status: "success", result: "success" };
        }

        // Create requests count
        await createApiCallsCount(dataForRequestsCountCalculation);

        /**
         * -------------------------
         * | EXECUTE BULK REQUESTS |
         * -------------------------
         */
        const finalResult = await Promise.all(requestPromises);

        /**
         * -------------------
         * | MODIFY RESPONSE |
         * -------------------
         */
        const ads = [];
        for(response of finalResult) {
            if(response && response.responses){
                ads.push(...response["responses"]);
            }
        }

        if(!ads.length) {
            return { status: "success", result: "success" };
        }

        const formattedAds = formatStatuses(ads);
        const groupedByStatuses = _.groupBy(formattedAds, (ad) => {
            return `${ad.status}-${ad.effectiveStatus}`;
        });

        const updatePromises = [];
        for(uniqueKey in groupedByStatuses){
            const updateAdIds = groupedByStatuses[uniqueKey].map(i => i.id);
            const [status, effectiveStatus] = uniqueKey.split("-");

            if(status && effectiveStatus) {
                updatePromises.push(LocalAdsDao._update({status, effectiveStatus}, {remoteAdId: updateAdIds}));
            }
        }

        if(!updatePromises.length) {
            return
        }

        /**
         * ---------------------------
         * | SPLIT UPDATES TO CHUNKS |
         * ---------------------------
         */
        const promiseChunks = _.chunk(updatePromises, 5);
        for(const promiseChunk of promiseChunks) {
            await Promise.all(promiseChunk);
        }

        return { status: "success", result: "success" };
    } catch (error) {
        console.log(error)
        return { status: "failed", result: error.message || "unknown error" };
    }
}

/**
 * Set active the unactive ads and campaigns of logged user
 * @param {number} userId
 * @param {any} remoteUserId
 * @returns {{status :string, result: any}}
 */
 async function executeOptimized() {
    try {
        const backendAds = await LocalAdsDao.getFacebookAdsForStatusSync();

        // Take only active ads
        const filteredAds = backendAds.filter(filterActiveAd);

        if(!filteredAds.length) {
            return { status: "success", result: "success" };
        }

        /**
         * ---------------------------------------------
         * | GROUP ADS -> remoteUser:adAccountId:adIds |
         * ---------------------------------------------
         */
        const groupedAdsByUser = _.groupBy(filteredAds, "remoteUserId");
        Object.keys(groupedAdsByUser).forEach(userId => {
            groupedAdsByUser[userId] = _.groupBy(groupedAdsByUser[userId], function(ad){
                return `${ad.adAccount.adAccountId}`;
            });

            Object.keys(groupedAdsByUser[userId]).forEach((accountId) => {
                groupedAdsByUser[userId][accountId] = groupedAdsByUser[userId][accountId].map(ad => ad.remoteAdId);
            })
        });

        /**
         * --------------------------
         * | GENERATE LOAD PROMISES |
         * --------------------------
         */
        const dataForRequestsCountCalculation  = {};
        const requestPromises = [];
        for(const userId in groupedAdsByUser) {
            const sdk = await getSdkParamsByRemoteUser(userId);

            if(!sdk) {
                continue;
            }

            Object.keys(groupedAdsByUser[userId]).forEach(accountId => {
                const adIds = groupedAdsByUser[userId][accountId];

                const promise = FacebookAdAccountsDao.getAds(sdk, {
                    adAccountId: accountId.toString(),
                    adIds
                });

                requestPromises.push(promise);

                // create data for calculate requests count
                if(sdk.authData) {
                    if(!dataForRequestsCountCalculation.hasOwnProperty(userId)) {
                        dataForRequestsCountCalculation[userId] = 1;
                    }else{
                        dataForRequestsCountCalculation[userId] += 1;
                    }
                }
            });
        }

        // Create requests count
        await createApiCallsCount(dataForRequestsCountCalculation);

        /**
         * -------------------------
         * | EXECUTE BULK REQUESTS |
         * -------------------------
         */
        const finalResult = await Promise.all(requestPromises);
        
        /**
         * -------------------
         * | MODIFY RESPONSE |
         * -------------------
         */
        const ads = [];
        for(const adsData of finalResult) {
            ads.push(...adsData.map(a => a._data));
        }

        if(!ads.length) {
            return { status: "success", result: "success" };
        }

        // Format statuses and filter ads which status will be updated in db
        const formattedAds = formatStatuses(ads, filteredAds);
        
        // Group ads by status-effectiveStatus pair
        const groupedByStatuses = _.groupBy(formattedAds, (ad) => {
            return `${ad.status}-${ad.effectiveStatus}`;
        });
        
        // Generate update promises that will update ads in our db
        const updatePromises = [];
        for(uniqueKey in groupedByStatuses){
            const updateAdRemoteIds = groupedByStatuses[uniqueKey].map(i => i.remoteId);
            const [status, effectiveStatus] = uniqueKey.split("-");

            if(status && effectiveStatus) {
                updatePromises.push(LocalAdsDao._update({status, effectiveStatus}, {remoteAdId: updateAdRemoteIds}));
            }
        }

        if(!updatePromises.length) {
            return
        }

        /**
         * ---------------------------
         * | SPLIT UPDATES TO CHUNKS |
         * ---------------------------
         */
        const promiseChunks = _.chunk(updatePromises, 5);
        for(const promiseChunk of promiseChunks) {
            await Promise.all(promiseChunk);
        }

        return { status: "success", result: "success" };
    } catch (error) {
        console.log(error)
        return { status: "failed", result: error.message || "unknown error" };
    }
}

/**
 * Filter active ad
 * @param {{
 *  endDate: string | null | 0;
 *  status: string;
 *  effectiveStatus: string;
 * }} ad 
 * @returns 
 */
function filterActiveAd(ad) {
    return ad.effectiveStatus === null || ["active", "pending", "pending_billing_info", "pending_review"].includes(ad.effectiveStatus);
}

/**
 * Set active the unactive ads and campaigns of logged user
 * @param {number} userId
 * @param {any} remoteUserId
 * @returns {{status :string, result: any}}
 */
async function executeTest() {
    try {
        const campaigns = await LocalCampaignsDao.getFacebookCampaignsForStatusSync();
        
        if(!campaigns.length) {
            return { status: "success", result: "success" };
        }

        /**
         * ----------------------------------------------
         * | GENERATE SDK LIST FOR EACH CAMPAIGN's USER |
         * ----------------------------------------------
         */
        const sdksList = {};
        for(let i = 0; i < campaigns.length; i++) {
            const { facebookId, facebookAdAccountOwnerId , ads } = campaigns[i];

            if(!sdksList.hasOwnProperty(facebookAdAccountOwnerId)) {
                sdksList[facebookAdAccountOwnerId] = {
                    sdk: null, 
                    campaignIds: {}
                };
            }

            if(!sdksList[facebookAdAccountOwnerId].sdk) {
                try {
                    const {sdk: sdkOfCurrentUser} = await getSdkParams(facebookAdAccountOwnerId);
                    sdksList[facebookAdAccountOwnerId].sdk = sdkOfCurrentUser;
                } catch (error) {
                    continue;
                }
            }

            // Take only active ads
            const filteredAds = ads.filter(filterActiveAd);

            if(filteredAds.length) {
                sdksList[facebookAdAccountOwnerId].campaignIds[facebookId] = filteredAds.map(a => a.remoteAdId);
            }
        }

        if(!Object.keys(sdksList).length) {
            return { status: "success", result: "success" };
        }

        /**
         * ---------------------------------------
         * | GENERATE Promises for bulk requests |
         * ---------------------------------------
         */
        const requestPromises = [];
        Object.keys(sdksList).forEach((row) => {
            const {sdk: neededSdk, campaignIds} = sdksList[row];

            const dataForequest = [];
            Object.keys(campaignIds).forEach((campaignId) => {
                dataForequest.push({ 
                    campaignId , 
                    adIds: campaignIds[campaignId],
                    adFields: ["id", "status", "effective_status"]
                });
            });

            const promise = FacebookCampaignsDao.bulkReadAds(neededSdk, dataForequest);
            requestPromises.push(promise);
        });

        if(!requestPromises.length) {
            return { status: "success", result: "success" };
        }

        /**
         * -------------------------
         * | EXECUTE BULK REQUESTS |
         * -------------------------
         */
        const finalResult = await Promise.all(requestPromises);

        /**
         * -------------------
         * | MODIFY RESPONSE |
         * -------------------
         */
        const ads = [];
        for(response of finalResult) {
            if(response && response.responses){
                ads.push(...response["responses"]);
            }
        }

        if(!ads.length) {
            return { status: "success", result: "success" };
        }

        const formattedAds = formatStatuses(ads);
        const groupedByStatuses = _.groupBy(formattedAds, (ad) => {
            return `${ad.status}-${ad.effectiveStatus}`;
        });

        console.log(finalResult);

        const updatePromises = [];
        for(uniqueKey in groupedByStatuses){
            const updateAdIds = groupedByStatuses[uniqueKey].map(i => i.id);
            const [status, effectiveStatus] = uniqueKey.split("-");

            if(status && effectiveStatus) {
                // updatePromises.push({status, effectiveStatus, ids: updateAdIds});
                updatePromises.push(LocalAdsDao._update({status, effectiveStatus}, {remoteAdId: updateAdIds}));
            }
        }

        if(!updatePromises.length) {
            return
        }

        /**
         * ---------------------------
         * | SPLIT UPDATES TO CHUNKS |
         * ---------------------------
         */
        const promiseChunks = _.chunk(updatePromises, 5);
        for(const promiseChunk of promiseChunks) {
            await Promise.all(promiseChunk);
        }

        return { status: "success", result: "success" };
    } catch (error) {
        console.log(error)
        return { status: "failed", result: error.message || "unknown error" };
    }
}

module.exports = {
    execute: executeOptimized,
    getSdkParams,
};
