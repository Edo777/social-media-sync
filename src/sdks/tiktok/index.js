const { TiktokSDK } = require("./lib/TiktokSDK");
const models = require("./models");

module.exports = {
    ...models,
    TiktokSDK,
};
