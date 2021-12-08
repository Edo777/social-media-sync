"use strict";
const utils = require("../../shared/database/utils");
const usersDefaultConfig = require("../seeds/static/default-user-config.json");

module.exports = (sequelize, DataTypes) => {
    const AppUsers = utils.model(
        sequelize,
        "AppUsers",
        {
            firstName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            timezone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            image: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            company: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            countryId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            regionId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            cityId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            // TODO: Migrate 21.07.20
            address1: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            // TODO: Migrate 21.07.20
            address2: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            accountType: {
                type: DataTypes.ENUM("admin", "user", "sub_user"),
            },
            refreshToken: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            creatorId: {
                allowNull: true,
                type: DataTypes.BIGINT.UNSIGNED,
            },
            publisherId: {
                allowNull: true,
                type: DataTypes.BIGINT.UNSIGNED,
            },
            configs: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: usersDefaultConfig,
            },
        }
    );

    return AppUsers;
};
