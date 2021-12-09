"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const SocialCampaigns = utils.model(
        sequelize,
        "SocialCampaigns",
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
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            publishStatus: {
                type: DataTypes.ENUM(["draft", "ready", "publishing", "finished"]),
                allowNull: false,
                defaultValue: "draft",
            },
            objective: {
                type: DataTypes.ENUM([
                    "adroot",
                    "reach",
                    "brand_awareness",
                    "traffic",
                    "app_installs",
                    "video_views",
                    "lead_generation",
                    "messages",
                    "website_visits",
                    "engagement",
                    "followers",
                    "preroll_view",
                    "conversions",
                    "catalog_sales",
                    "job_application",
                    "app_reengagement",
                ]),
                allowNull: false,
            },
            objectiveData: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM(["active", "paused", "deleted", "archived"]),
                allowNull: false,
                defaultValue: "active",
            },
            startDate: {
                type: "DATETIME",
                allowNull: true,
            },
            endDate: {
                type: "DATETIME",
                allowNull: true,
            },
            totalSpend: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0.0,
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
            draftStep: {
                type: DataTypes.ENUM(
                    "created",
                    "choose_ad_account",
                    "ad",
                    "audience_placement",
                    "budget_and_schedule",
                    "finished"
                ),
                defaultValue: "created",
            },

            // social media campaigns
            facebookId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            facebookAdAccountId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            facebookAdAccountOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            facebookPixelId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            facebookPixelEvent: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            facebookStatus: {
                type: DataTypes.ENUM(["skipped", "draft", "publishing", "done", "failed"]),
                allowNull: false,
            },
            facebookError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            facebookUserId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            instagramId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            instagramAdAccountId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            instagramAdAccountOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            instagramPixelId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            instagramPixelEvent: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            instagramStatus: {
                type: DataTypes.ENUM(["skipped", "draft", "publishing", "done", "failed"]),
                allowNull: false,
            },
            instagramError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            instagramUserId: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            linkedinId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            linkedinAdAccountId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            linkedinAdAccountOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            linkedinStatus: {
                type: DataTypes.ENUM(["skipped", "draft", "publishing", "done", "failed"]),
                allowNull: false,
            },
            linkedinError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            linkedinUserId: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            tiktokId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            tiktokAdAccountId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            tiktokAdAccountOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            tiktokStatus: {
                type: DataTypes.ENUM(["skipped", "draft", "publishing", "done", "failed"]),
                allowNull: false,
            },
            tiktokError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            tiktokUserId: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            twitterId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            twitterAdAccountId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            twitterAdAccountOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            twitterStatus: {
                type: DataTypes.ENUM(["skipped", "draft", "publishing", "done", "failed"]),
                allowNull: false,
            },
            twitterError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            twitterUserId: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            // GOOGLE
            googleAdAccountId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            googleAdAccountOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            // GOOLE SEARCH
            googleSearchStatus: {
                type: DataTypes.ENUM(["skipped", "draft", "publishing", "done", "failed"]),
                allowNull: false,
            },

            // GOOGLE DISPLAY
            googleDisplayStatus: {
                type: DataTypes.ENUM(["skipped", "draft", "publishing", "done", "failed"]),
                allowNull: false,
            },

            // GOOGLE APPINSTALL
            googleAppinstallStatus: {
                type: DataTypes.ENUM(["skipped", "draft", "publishing", "done", "failed"]),
                allowNull: false,
            },
            googleUserId: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            lastStatusSeen: {
                type: "TIMESTAMP",
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
                allowNull: false,
            },
            lastStatusUpdateProcess: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },

            // activity
            facebookIsActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            googleIsActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            tiktokIsActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            linkedinIsActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            twitterIsActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            hooks: {
                beforeUpdate(instance) {
                    if (instance.impressions == 0) {
                        instance.ctr = 0;
                    } else {
                        // if (instance.impressions) {
                        //     instance.ctr = 100 * (instance.clicks / instance.impressions);
                        // }
                    }
                },
            },
        }
    );
    
    return SocialCampaigns;
};
