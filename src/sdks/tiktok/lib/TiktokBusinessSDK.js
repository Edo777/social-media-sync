const TiktokException = require("./TiktokException");
const { Campaign } = require("../models");

/**
 * TiktokBusinessSDK constructor.
 * @param {TiktokApiRequest} api
 */
const TiktokBusinessSDK = function (api) {
    this._api = api;
};

/**
 * Handle api calls.
 * @param {Function} callback
 * @returns {Promise<any>}
 */
TiktokBusinessSDK.prototype._try = async function (callback) {
    try {
        return await callback(this._api);
    } catch (error) {
        throw new TiktokException(error);
    }
};

/**
 * Get campaigns by advertiser id.
 * @param {Number} advertiserid
 * @return {Promise<any>}
 */
TiktokBusinessSDK.prototype.getCampaigns = async function (advertiserid) {
    return this._try(async function (api) {
        const params = {
            /* eslint-disable camelcase */
            advertiser_id: advertiserid,
            fields: Object.values(Campaign.fields),
            /* eslint-enable camelcase */
        };

        const result = await api.get("/campaign/get", params);
        return result.data.list.map(function (apiData) {
            return Campaign.toModelData(apiData);
        });
    });
};

/**
 * Create new campaign.
 * @param {Campaign} model
 * @return {Promise<any>}
 */
TiktokBusinessSDK.prototype.createCampaign = async function (model) {
    return this._try(async function (api) {
        const params = Campaign.toApiData(model);

        return await api.post("/campaign/create", params, {
            "Content-Type": "application/json",
        });
    });
};

module.exports = TiktokBusinessSDK;
