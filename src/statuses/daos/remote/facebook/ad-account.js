const { AdAccount } = require("../../../../sdks/facebook");

/**
 * Get ads of campaign
 * @param {any} sdk 
 * @param {{
 *  adAccountId: string,
 *  adIds: [string],
 *  adFields: [string]
 * }} data 
 * @returns {Promise<[{
 *  responses: [[object]],
 *  errors: [[object]]
 * }]>}
 */
async function getAds(sdk, data) {
    try {
        const adAccount = sdk.instance(AdAccount, {id: data.adAccountId});

        let fields = data.adFields || [
            'id',
            'status',
            'effective_status'
        ];

        let params = { id : data.adIds };

        return await adAccount.getAds(fields, params);
    } catch (error) {
        console.log(error);
        console.log("ERROR IN TIME LOAD ADS OF ACCOUNT ->" + data.adAccountId);
        console.log("ERROR MESSAGE " , error.message);
        return [];
    }
}

module.exports = {
    getAds
};
