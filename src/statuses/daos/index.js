const LocalAdsDao = require("./local/ads");
const LocalCampaignsDao = require("./local/campaigns");
const LocalCronJobs = require("./local/cronjobs");

// Facebook
const FacebookCampaignsDao = require("./remote/facebook/campaign");

module.exports = {
    // Local
    LocalAdsDao,
    LocalCronJobs,
    LocalCampaignsDao,

    // Facebook
    FacebookCampaignsDao
}