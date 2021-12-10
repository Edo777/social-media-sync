const { Sequelize } = require("../../../../shared/database/models");
const { LocalCampaignsDao, LocalAdDao, FacebookCampaignsDao } = require("../../../../daos");
const { getSdkByPlatform } = require("../../../../daos/global/sdk");
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

async function formatStatuses(data) {

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

        console.log(finalResult, "++++++++++++++++++++++++++++++++++++++++++++++++");

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
