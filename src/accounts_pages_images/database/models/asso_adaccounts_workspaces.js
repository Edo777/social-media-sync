"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const SocialAssoAdaccountsWorkspaces = utils.model(
        sequelize,
        "SocialAssoAdaccountsWorkspaces",
        {
            uniqueKey: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            workspaceId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            workspaceOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            platform: {
                type: DataTypes.STRING,
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

            isDefault: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        }
    );

    return SocialAssoAdaccountsWorkspaces;
};
