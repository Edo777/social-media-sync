/**
 * Remove ad
 * In time app install goal ad can't be deleted: (only adgroup)
 * @param sdk
 * @param {{
 *  attributes: {
 *      campaign: [string],
 *      adGroup: [string],
 *      adGroupAd: [string],
 *      ad: [string],
 *  },
 *  condition: {
 *      field: string,
 *      operator: "IN" | "NOT IN"
 *      values: [string]
 *  }
 * }} options
 * @returns {Promise<Array<object>>}
 */
async function getAdsBySpecOptions(sdk, options) {
    try {
        return await sdk.Ad.getBySpecOptions(options)
    } catch (e) {
        console.error(e);
        throw e;
    }
}

module.exports = {
    getAdsBySpecOptions
}