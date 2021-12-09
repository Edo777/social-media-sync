/**
 * TwitterBusinessSDK constructor.
 * @param {TwitterApiRequest} api
 */
const TwitterBusinessSDK = function (api) {
    this._api = api;
};

TwitterBusinessSDK.prototype.getAdAccount = function () {
    return this._api.get("/accounts");
};

module.exports = TwitterBusinessSDK;
