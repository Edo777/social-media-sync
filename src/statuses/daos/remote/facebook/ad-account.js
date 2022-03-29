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
        const adAccount = sdk.instance(AdAccount, { id: data.adAccountId })

        let fields = data.adFields || ['id', 'status', 'effective_status'];

        let params = {
            level: 'ad',
            filtering: [{field: 'ad.id', operator: 'IN', value: data.adIds}],
            limit: data.adIds.length
        };

        return await adAccount.getAds(fields, params);
    } catch (error) {
        return [];
    }
}

module.exports = {
    getAds
};


