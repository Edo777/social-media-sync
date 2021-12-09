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
        facebookUserId = this.sdk["authData"].facebookUserId;
    }

    return { sdk, remoteUserId: facebookUserId };
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

        console.log("CMPS ---------- ", campaigns.length)

        if(!campaigns.length) {
            return { status: "success", result: "success" };
        }

        // Set sdks
        const sdksList = {};
        for(let i = 0; i < campaigns.length; i++) {
            const { facebookId, facebookAdAccountOwnerId } = campaigns[i];

            if(!sdksList.hasOwnProperty(facebookAdAccountOwnerId)) {
                const sdkOfCurrentUser = await getSdkParams(facebookAdAccountOwnerId);

                sdksList[facebookAdAccountOwnerId].sdk = sdkOfCurrentUser;
            }

            if(!sdksList[facebookAdAccountOwnerId].campaigns) {
                sdksList[facebookAdAccountOwnerId].campaigns = [];
            }

            sdksList[facebookAdAccountOwnerId].campaigns.push(facebookId);

        }

        console.log("SDKS ---------- ", Object.keys(sdksList).length)

        // Set promises
        const requestPromises = [];
        Object.keys(sdksList).forEach((d) => {
            const {sdk, campaigns} = d;

            campaigns.forEach((campaignId) => {
                FacebookCampaignsDao.bulkReadAds(sdk, { campaignId , adFields: ["id", "status", "effective_status"]});
            });
        });

        console.log("PROMISES ---------- ", requestPromises.length)

        if(!requestPromises.length) {
            return { status: "success", result: "success" };
        }

        // Execute load
        const finalResult = await Promise.all(requestPromises);

        console.log(finalResult);

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
