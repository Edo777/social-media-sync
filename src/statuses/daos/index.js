const LocalAdsDao = require("./local/ads");
const LocalCampaignsDao = require("./local/campaigns");

// Facebook
const FacebookCampaignsDao = require("./remote/facebook/campaign");

module.exports = {
    // Local
    LocalAdsDao,
    LocalCampaignsDao,

    // Facebook
    FacebookCampaignsDao
}