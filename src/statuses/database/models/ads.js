"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const SocialAds = utils.model(
        sequelize,
        "SocialAds",
        {
            userId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            workspaceId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            workspaceOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            campaignId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            adAccountId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            adAccountOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            libraryAdId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            provider: {
                type: DataTypes.ENUM([
                    "facebook",
                    "instagram",
                    "linkedin",
                    "tiktok",
                    "twitter",
                    // "google",
                    // "youtube",
                    "google-appinstall",
                    "google-search",
                    "google-display",
                    "google-image",
                ]),
                allowNull: false,
            },
            remoteAdId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            remoteUserId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            remoteAdStatus: {
                type: DataTypes.ENUM([
                    "draft",
                    "pending",
                    "queued",
                    "publishing",
                    "done",
                    "failed",
                ]),
                allowNull: false,
                defaultValue: "draft",
            },
            // TODO: NEW
            status: {
                type: DataTypes.ENUM(["active", "paused", "archived"]),
                allowNull: false,
                defaultValue: "active",
            },
            effectiveStatus: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            remoteAdError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            pageId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            pageProvider: {
                type: DataTypes.ENUM([
                    "facebook",
                    "instagram",
                    "linkedin",
                    "tiktok",
                    "twitter",
                    // "google",
                    // "youtube",
                    "google-appinstall",
                    "google-search",
                    "google-display",
                    "google-image",
                ]),
                allowNull: false,
            },
            budgetValue: {
                type: DataTypes.DOUBLE,
                allowNull: true,
            },
            budgetType: {
                type: DataTypes.ENUM(["daily", "lifetime"]),
                allowNull: true,
            },
            startDate: {
                type: "DATETIME",
                allowNull: true,
            },
            endDate: {
                type: "DATETIME",
                allowNull: true,
            },
            isAutoPlacement: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            placements: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            targeting: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            infoData: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // reporting info
            impressions: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            clicks: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            totalSpend: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0.0,
            },
            cpm: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0.0,
            },
            ctr: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0.0,
            },
            cpc: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0.0,
            },
            updateData: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // facebook
            facebookAdsetId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            facebookAdsetStatus: {
                type: DataTypes.ENUM(["draft", "publishing", "done", "failed"]),
                allowNull: false,
                defaultValue: "draft",
            },
            facebookAdsetError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            facebookAdCreativeId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            facebookAdCreativeStatus: {
                type: DataTypes.ENUM(["draft", "publishing", "done", "failed"]),
                allowNull: false,
                defaultValue: "draft",
            },
            facebookAdCreativeError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            // instagram
            instagramAdsetId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            instagramAdsetStatus: {
                type: DataTypes.ENUM(["draft", "publishing", "done", "failed"]),
                allowNull: false,
                defaultValue: "draft",
            },
            instagramAdsetError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            instagramAdCreativeId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            instagramAdCreativeStatus: {
                type: DataTypes.ENUM(["draft", "publishing", "done", "failed"]),
                allowNull: false,
                defaultValue: "draft",
            },
            instagramAdCreativeError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            // GOOGLE [campaign]
            googleCampaignId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            googleCampaignStatus: {
                type: DataTypes.ENUM(["draft", "publishing", "done", "failed"]),
                allowNull: false,
                defaultValue: "draft",
            },
            googleCampaignError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            loginCustomerId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            clientCustomerId: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            // GOOGLE [adgroup]
            googleAdgroupId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            googleAdgroupStatus: {
                type: DataTypes.ENUM(["draft", "publishing", "done", "failed"]),
                allowNull: false,
                defaultValue: "draft",
            },
            googleAdgroupError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            // tiktok
            tiktokAdgroupId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            tiktokAdgroupStatus: {
                type: DataTypes.ENUM(["draft", "publishing", "done", "failed"]),
                allowNull: false,
                defaultValue: "draft",
            },
            tiktokAdgroupError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },

            // google
            // TODO: add fields
        },
        {
            hooks: {
                beforeUpdate(instance) {
                    if (instance.impressions == 0) {
                        instance.ctr = 0;
                    }
                    //  else {
                    //     instance.ctr = 100 * (instance.clicks / instance.impressions);
                    // }
                },
            },
        }
    );

    return SocialAds;
};
