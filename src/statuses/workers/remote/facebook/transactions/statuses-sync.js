const { Sequelize } = require("../../../../shared/database/models");
const { LocalCampaignsDao, LocalAdsDao, FacebookCampaignsDao } = require("../../../../daos");
const { getSdkByPlatform } = require("../../../../daos/global/sdk");
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
            const { facebookId, facebookAdAccountOwnerId } = campaigns[i];

            if(!sdksList.hasOwnProperty(facebookAdAccountOwnerId)) {
                sdksList[facebookAdAccountOwnerId] = {
                    sdk: null, 
                    campaignIds: []
                };
            }

            if(!sdksList[facebookAdAccountOwnerId].sdk) {
                const {sdk: sdkOfCurrentUser} = await getSdkParams(facebookAdAccountOwnerId);

                sdksList[facebookAdAccountOwnerId].sdk = sdkOfCurrentUser;
            }

            sdksList[facebookAdAccountOwnerId].campaignIds.push(facebookId);

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
            campaignIds.forEach((campaignId) => {
                dataForequest.push({ 
                    campaignId , adFields: ["id", "status", "effective_status"]
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
            ads.push(...response["responses"]);
        }

        if(!ads.length) {
            return { status: "success", result: "success" };
        }

        const formattedAds = formatStatuses(ads);
        console.log(formattedAds, "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

        const groupedByStatuses = _.groupBy(formattedAds, (ad) => {
            return `${ad.status}-${ad.effectiveStatus}`;
        });

        const updatePromises = [];
        for(uniqueKey in groupedByStatuses){
            const updateAdIds = groupedByStatuses[uniqueKey].map(i => i.id);
            const [status, effectiveStatus] = uniqueKey.split("-");

            if(status && effectiveStatus) {
                updatePromises.push({status, effectiveStatus, ids: updateAdIds});
                // updatePromises.push(LocalAdsDao._update({status, effectiveStatus}, {remoteAdId: updateAdIds}));
            }
        }
        console.log(updatePromises, "--------------------------------------------------------");

        if(!updatePromises.length) {
            return
        }
        // console.log(updatePromises, "--------------------------------------------------------");

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
