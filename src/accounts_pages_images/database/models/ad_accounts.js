"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const SocialAdAccounts = utils.model(sequelize, "SocialAdAccounts", {
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
        status: {
            type: DataTypes.ENUM([
                "ACTIVE",
                "DISABLED",
                "UNSETTLED",
                "PENDING_RISK_REVIEW",
                "PENDING_SETTLEMENT",
                "IN_GRACE_PERIOD",
                "PENDING_CLOSURE",
                "CLOSED",
                "ANY_ACTIVE",
                "ANY_CLOSED",
            ]),
            allowNull: false,
        },
        disableReason: {
            type: DataTypes.ENUM([
                "NONE",
                "ADS_INTEGRITY_POLICY",
                "ADS_IP_REVIEW",
                "RISK_PAYMENT",
                "GRAY_ACCOUNT_SHUT_DOWN",
                "ADS_AFC_REVIEW",
                "BUSINESS_INTEGRITY_RAR",
                "PERMANENT_CLOSE",
                "UNUSED_RESELLER_ACCOUNT",
                "UNUSED_ACCOUNT",
            ]),
            allowNull: false,
        },
        adAccountId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        platformUserId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        adAccountName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        adAccountIcon: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        adAccountOwnerId: {
            // type: DataTypes.BIGINT.UNSIGNED,
            type: DataTypes.STRING,
            allowNull: false,
        },
        adAccountIsBusiness: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        adAccountBusinessId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },
        adAccountBusinessName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        adAccountLoginCustomerId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    });

    return SocialAdAccounts;
};
