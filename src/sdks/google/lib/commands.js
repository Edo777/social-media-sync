module.exports = {
    // Customer INSTANCE
    Customer: {
        getAll: "customer/get_customers",
        link: "customer/link_customer",
        getAccessibleBidStrategies: "customer/get_accessible_bidding_strategies",
    },

    // Campaign INSTANCE
    Campaign: {
        create: "campaign/create_campaign",
        update: "campaign/update_campaign",
        delete: "campaign/delete_campaign",
        get: "campaign/get_campaign",
        getAll: "campaign/get_campaigns",
        getCriterions: "campaign/get_campaign_criterions",
    },

    // AdGroup INSTANCE
    AdGroup: {
        create: "ad_group/create_ad_group",
        update: "ad_group/update_ad_group",
        delete: "ad_group/delete_ad_group",
        get: "ad_group/get_ad_group",
        getAll: "ad_group/get_ad_groups",
        getCriterions: "ad_group/get_ad_group_criterions",
    },

    // Keyword INSTANCE
    Keyword: {
        create: "create_keywords",
    },

    // Ad Instance
    Ad: {
        create: "ad/create_ad",
        getAll: "ad/get_ads",
        getBySpecOptions: "ad/get_ads_spec",
        get: "ad/get_ad",
        update: "ad/update_ad",
        delete: "ad/delete_ad",
    },

    MediaFile: {
        create: "mediafile/create_mediafile",
    },

    Asset: {
        create: "media_asset/create_asset",
    },

    Reporting: {
        getCampaignReport: "reporting/get_campaign_report",
        getAdReport: "reporting/get_ad_report",
        getReport: "reporting/get_report",

        testReport: "reporting/age_range_view", // TODO: test

        ageRangeView: "reporting/age_range_view",
        genderView: "reporting/gender_view",
        locationView: "reporting/location_view",
    },

    GeoTargets: {
        getByResources: "geo_target_constants/get_geo_targets_by_resources",
    },

    BatchJob: {
        // async command
        bulkUpdateCampaignsAdsAdGroups: "batch_jobs/update_campaign_adgroup_ad_status",
    },
};
