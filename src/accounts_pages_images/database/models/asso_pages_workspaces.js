"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const SocialAssoPagesWorkspaces = utils.model(
        sequelize,
        "SocialAssoPagesWorkspaces",
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

            pageId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            pageOwnerId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            isDefault: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            hooks: {
                beforeCreate: function (instance) {
                    instance.uniqueKey = `${instance.workspaceId}-${instance.pageId}`;
                },
                beforeBulkCreate: function (instances) {
                    instances.forEach(function (instance) {
                        instance.uniqueKey = `${instance.workspaceId}-${instance.pageId}`;
                    });
                },
            },
        }
    );

    return SocialAssoPagesWorkspaces;
};
