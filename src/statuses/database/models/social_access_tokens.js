"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const SocialAccessTokens = utils.model(sequelize, "SocialAccessTokens", {
        userId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },

        // facebook
        facebookIsLogged: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        facebookUserId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },

        // [name, picture, and etc...]
        facebookUserInfo: {
            type: DataTypes.JSON,
            allowNull: true,
        },

        facebookAccessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        facebookAccessExpire: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        facebookAccessLastTime: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },

        // linkedin
        linkedinIsLogged: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        linkedinUserId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // [name, picture, and etc...]
        linkedinUserInfo: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        linkedinAccessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        linkedinAccessExpire: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        linkedinAccessLastTime: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },
        linkedinRefreshToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        linkedinRefreshExpire: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        linkedinLoginLastTime: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },

        // tiktok
        tiktokIsLogged: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        tiktokUserId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },
        // [name, picture, and etc...]
        tiktokUserInfo: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        tiktokAccessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        // twitter
        twitterIsLogged: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        twitterUserId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // [name, picture, and etc...]
        twitterUserInfo: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        twitterAccessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        twitterAccessSecret: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        // google
        googleIsLogged: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        googleUserId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // [name, picture, and etc...]
        googleUserInfo: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        googleAccessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        googleAccessExpire: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        googleRefreshToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        googleAccessLastTime: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },
    });

    return SocialAccessTokens;
};
