/**
 * LinkedinBusinessSDK constructor.
 * @param {LinkedinApiRequest} api
 */
const LinkedinBusinessSDK = function (api) {
    this._api = api;
};

LinkedinBusinessSDK.prototype.getAdAccounts = async function () {
    const result = await this._api.get("/adAccountsV2?q=search");
    console.log({ result });

    return result;
};

module.exports = LinkedinBusinessSDK;
