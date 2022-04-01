const { LocalAdsDao, LocalApiCallsDao, FacebookAdAccountsDao } = require("../../../../daos");
const { getSdkByRemoteUser } = require("../../../../daos/global/sdk");
const { EffectiveStatusDetector } = require("../../../../utils");
const _ = require("lodash");

/**
 * Get sdk and remote user
 * @param {number} id
 * @returns {{ sdk: any, remoteUserId: string }}
 */
 async function getSdkParamsByRemoteUser(id) {
    try {
        const sdk = await getSdkByRemoteUser("facebook", id);

        return sdk;
    } catch (error) {
        return null;
    }
}

/**
 * Detect statuses
 * When local and remote ad's statuses will be same, function doesn't return that ad
 * @param {[{id: number, status: string, effective_status: string}]} remoteAds 
 * @param {[{id: number, status: string, effectiveStatus: string, remoteAdId: string}]} localAds 
 * @returns {[{id: string, remoteId: string, status: string, effectiveStatus: string}]}
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

            const result = { id: adFromLocal.id, remoteId: adFromRemote.id, status, effectiveStatus };

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
            const updateAdIds = groupedByStatuses[uniqueKey].map(i => i.id);
            const [status, effectiveStatus] = uniqueKey.split("-");

            if(status && effectiveStatus) {
                updatePromises.push(LocalAdsDao._update({status, effectiveStatus}, {id: updateAdIds}));
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

module.exports = {
    execute: executeOptimized
};
