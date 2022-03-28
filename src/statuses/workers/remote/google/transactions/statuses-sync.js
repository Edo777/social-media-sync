const { Sequelize } = require("../../../../shared/database/models");
const { LocalAdsDao, GoogleAdsDao } = require("../../../../daos");
const { getSdkByPlatform , getSdkByRemoteUser } = require("../../../../daos/global/sdk");
const {EffectiveStatusDetector, sleep} = require("../../../../utils");
const _ = require("lodash");

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
 * Set sdk params
 * @param {number} localCampaignId
 * @param {{
 *  userId: number
 *  remoteUserId: string
 *  clientCustomerId: number,
 *  loginCustomerId: number,
 * } | null} returnSdkFor
 */
async function getSdkParams(returnSdkFor = null) {
    try {
        let sdk = null;

        if(returnSdkFor) {
            if(returnSdkFor.remoteUserId){
                sdk = await getSdkByRemoteUser("google", returnSdkFor.remoteUserId);
            }else if(returnSdkFor.userId) {
                sdk = await getSdkByPlatform("google", returnSdkFor.userId);
            }

            if(sdk) {
                sdk.setClientCustomerId(returnSdkFor.clientCustomerId);
                sdk.setLoginCustomerId(returnSdkFor.loginCustomerId);
            }
        }

        return sdk;
    } catch (error) {
        return null
    }
}

/**
 * Detect statuses
 * @param {[{id: number, status: string, effective_status: string}]} ads 
 * @returns {[{id: number, status: string, effectiveStatus: string}]}
 */
 function formatStatuses(ads) {
    const formattedAds = [];
    for (let i = 0; i < ads.length; i++) {
        const {ad_group, ad, campaign, status: remoteAdStatus, policySummary } = JSON.parse(JSON.stringify(ads[i]));

        if (ad_group && campaign && policySummary && remoteAdStatus) {
            const { status, effectiveStatus } = EffectiveStatusDetector.detectGoogle({
                adStatus: remoteAdStatus,
                policyStatuses: policySummary || { reviewStatus: null, approvalStatus: null },
                adGroupStatus: ad_group.status,
                campaignProcessingStatus: campaign.servingStatus,
                campaignStatus: campaign.status,
            });

            formattedAds.push({ id: ad.id, status, effectiveStatus });
        }
    }

    return formattedAds;
}

/**
 * Set active the unactive ads and campaigns of logged user
 * @param {number} userId
 * @param {any} remoteUserId
 * @returns {{status :string, result: any}}
 */
async function execute() {
    try {
        const adsAdgroupsCampaigns = await LocalAdsDao.getGoogleAdsForStatusSync();

        if(!adsAdgroupsCampaigns.length) {
            return { status: "success", result: "success" };
        }

        const groupedAds = _.groupBy(adsAdgroupsCampaigns, ({ loginCustomerId, clientCustomerId, adAccountOwnerId }) => {
            return `${loginCustomerId}-${clientCustomerId}-${adAccountOwnerId}`;
        })

        /**
         * --------------------------------------------------------------------------
         * | GENERATE SDK LIST FOR EACH CAMPAIGN's loginCustomerId-clientCustomerId |
         * --------------------------------------------------------------------------
         */
        const sdksList = {};
        const concattedIds =  Object.keys(groupedAds);
        
        for(let i = 0; i < concattedIds.length; i++) {
            const loginClientCustomerId = concattedIds[i];
            const [loginCustomerId, clientCustomerId, userId] = loginClientCustomerId.split("-");
            
            // sdk for job
            const sdk = await getSdkParams({clientCustomerId, loginCustomerId, userId});

            if(!sdk) {
                continue;
            }

            // Take ad's ids to get from google
            const adIds = groupedAds[loginClientCustomerId].map((ad) => ad.remoteAdId);

            if(!adIds.length) {
                continue;
            }
            
            // Set sdk and ad's ids to get 
            sdksList[loginClientCustomerId] = { sdk: sdk, ads: adIds };
        }

        if(!Object.keys(sdksList).length) {
            return { status: "success", result: "success" };
        }

        /**
         * ----------------------------------
         * | GENERATE Promises for read ads |
         * ----------------------------------
         */
        const requestPromises = [];
        Object.keys(sdksList).forEach((row) => {
            const {sdk: neededSdk, ads: adIds} = sdksList[row];

            const dataForequest = {
                attributes: { 
                    campaign: ["id", "status", "serving_status", "name"],
                    adGroup: ["id", "status"], 
                    adGroupAd : ["status", "policy_summary.review_status", "policy_summary.approval_status"], 
                    ad : ["id", "name"] 
                  },
                  condition: {
                    field: "ad_group_ad.ad.id",
                    operator: "IN",
                    values: adIds
                  }
            };

            const promise = GoogleAdsDao.getAdsBySpecOptions(neededSdk, dataForequest);
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
        const finalResult = await Promise.allSettled(requestPromises);
        const successResults = (finalResult.filter((r) => r.status === "fulfilled")).map((d) => d.value);

        /**
         * -------------------
         * | MODIFY RESPONSE |
         * -------------------
         */
        const ads = [];
        for(response of successResults) {
            if(response && response.length){
                ads.push(...response);
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
            return { status: "success", result: "success" };
        }

        /**
         * ---------------------------
         * | SPLIT UPDATES TO CHUNKS |
         * ---------------------------
         */
        const promiseChunks = _.chunk(updatePromises, 5);
        for(const promiseChunk of promiseChunks) {
            await Promise.all(promiseChunk);
            await sleep(3000);
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
        const backendAdsAdgroupsCampaigns = await LocalAdsDao.getGoogleAdsForStatusSync();
        const adsAdgroupsCampaigns = backendAdsAdgroupsCampaigns.filter(filterActiveAd);

        if(!adsAdgroupsCampaigns.length) {
            return { status: "success", result: "success" };
        }

        const groupedAds = _.groupBy(adsAdgroupsCampaigns, ({ loginCustomerId, clientCustomerId, remoteUserId }) => {
            return `${loginCustomerId}-${clientCustomerId}-${remoteUserId}`;
        })

        /**
         * --------------------------------------------------------------------------
         * | GENERATE SDK LIST FOR EACH CAMPAIGN's loginCustomerId-clientCustomerId |
         * --------------------------------------------------------------------------
         */
        const sdksList = {};
        const concattedIds =  Object.keys(groupedAds);
        
        for(let i = 0; i < concattedIds.length; i++) {
            const loginClientCustomerId = concattedIds[i];
            const [loginCustomerId, clientCustomerId, remoteUserId] = loginClientCustomerId.split("-");
            
            // sdk for job
            const sdk = await getSdkParams({clientCustomerId, loginCustomerId, remoteUserId});
            console.log(sdk.loginClientCustomerId, "---------------------", sdk.clientCustomerId);
            if(!sdk || !sdk.loginClientCustomerId || !sdk.clientCustomerId) {
                continue;
            }

            // Take ad's ids to get from google
            const adIds = groupedAds[loginClientCustomerId].map((ad) => ad.remoteAdId);

            if(!adIds.length) {
                continue;
            }
            
            // Set sdk and ad's ids to get 
            sdksList[loginClientCustomerId] = { sdk: sdk, ads: adIds };
        }

        if(!Object.keys(sdksList).length) {
            return { status: "success", result: "success" };
        }

        /**
         * ----------------------------------
         * | GENERATE Promises for read ads |
         * ----------------------------------
         */
        const requestPromises = [];
        Object.keys(sdksList).forEach((row) => {
            const {sdk: neededSdk, ads: adIds} = sdksList[row];

            const dataForequest = {
                attributes: { 
                    campaign: ["id", "status", "serving_status", "name"],
                    adGroup: ["id", "status"], 
                    adGroupAd : ["status", "policy_summary.review_status", "policy_summary.approval_status"], 
                    ad : ["id", "name"] 
                  },
                  condition: {
                    field: "ad_group_ad.ad.id",
                    operator: "IN",
                    values: adIds
                  }
            };

            const promise = GoogleAdsDao.getAdsBySpecOptions(neededSdk, dataForequest);
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
        const finalResult = await Promise.allSettled(requestPromises);
        const successResults = (finalResult.filter((r) => r.status === "fulfilled")).map((d) => d.value);

        /**
         * -------------------
         * | MODIFY RESPONSE |
         * -------------------
         */
        const ads = [];
        for(response of successResults) {
            if(response && response.length){
                ads.push(...response);
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
            return { status: "success", result: "success" };
        }

        /**
         * ---------------------------
         * | SPLIT UPDATES TO CHUNKS |
         * ---------------------------
         */
        const promiseChunks = _.chunk(updatePromises, 5);
        for(const promiseChunk of promiseChunks) {
            await Promise.all(promiseChunk);
            await sleep(3000);
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
