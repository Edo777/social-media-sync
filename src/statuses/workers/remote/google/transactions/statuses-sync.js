const { Sequelize } = require("../../../../shared/database/models");
const { LocalCampaignsDao, LocalAdsDao, GoogleAdsDao } = require("../../../../daos");
const { getSdkByPlatform, getSdkByRemoteUser } = require("../../../../daos/global/sdk");
const {EffectiveStatusDetector} = require("../../../../utils");
const _ = require("lodash");
const { or, and } = Sequelize.Op;

/**
 * Set sdk params
 * @param {number} localCampaignId
 * @param {{
 *  userId: number
 *  clientCustomerId: number,
 *  loginCustomerId: number,
 * } | null} returnSdkFor
 */
async function getSdkParams(returnSdkFor = null) {
    try {
        let sdk = null;

        if(returnSdkFor) {
            sdk = await getSdkByPlatform("google", returnSdkFor.userId);

            sdk.setClientCustomerId(returnSdkFor.clientCustomerId);
            sdk.setLoginCustomerId(returnSdkFor.loginCustomerId);
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
        const adFromRemote = JSON.parse(JSON.stringify(ads[i]));

        if (adFromRemote && adFromRemote["effective_status"] && adFromRemote["status"]) {
            const { status, effectiveStatus } = EffectiveStatusDetector.detectFacebook(
                adFromRemote["effective_status"],
                adFromRemote["status"]
            );

            formattedAds.push({ id: adFromRemote.id, status, effectiveStatus });
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
                    campaign: ["id", "status", "name"],
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
        return console.log(JSON.stringify(JSON.parse(finalResult)));

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
    execute,
    getSdkParams,
};
