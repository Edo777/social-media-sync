const LocalAdsDao = require("./local/ads");
const LocalCampaignsDao = require("./local/campaigns");
const LocalCronJobs = require("./local/cronjobs");
const LocalApiCallsDao = require("./local/api_calls");

// Facebook
const FacebookCampaignsDao = require("./remote/facebook/campaign");

// Google
const GoogleAdsDao = require("./remote/google/ad");

module.exports = {
    // Local
    LocalAdsDao,
    LocalCronJobs,
    LocalCampaignsDao,
    LocalApiCallsDao,

    // Facebook
    FacebookCampaignsDao,

    // Google
    GoogleAdsDao
}