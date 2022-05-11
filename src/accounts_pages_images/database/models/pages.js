"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const SocialPages = utils.model(sequelize, "SocialPages", {
        userId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },
        platform: {
            type: DataTypes.ENUM(["facebook", "linkedin", "tiktok", "twitter", "google"]),
            allowNull: false,
        },
        userVisible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        pageAccessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        pageId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        promotionEligible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        promotionIneligibleReason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        canPost: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        platformUserId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        pageName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        pageIcon: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        pageBackedInstagramAccountId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },
        pageBackedInstagramAccountUsername: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        pageBackedInstagramAccountIcon: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isWhatsappBusinessNumber: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        whatsappNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        instagramAccountId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },
        instagramAccountUsername: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        instagramAccountIcon: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    });

    return SocialPages;
};
