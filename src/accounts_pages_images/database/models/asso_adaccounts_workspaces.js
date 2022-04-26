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
        },
        {
            hooks: {
                beforeCreate: function (instance) {
                    instance.uniqueKey = `${instance.workspaceId}-${instance.adAccountId}`;
                },
                beforeBulkCreate: function (instances) {
                    instances.forEach(function (instance) {
                        instance.uniqueKey = `${instance.workspaceId}-${instance.adAccountId}`;
                    });
                },
            },
        }
    );

    SocialAssoAdaccountsWorkspaces.associate = function (models) {
        // Workspace belongs to users
        SocialAssoAdaccountsWorkspaces.belongsTo(models["SocialAdAccounts"], {
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            foreignKey: "adAccountId",
            as: "workspaceAdAccount",
        });

        // Workspace belongs to users
        SocialAssoAdaccountsWorkspaces.belongsTo(models["SocialWorkspaces"], {
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            foreignKey: "workspaceId",
            as: "adAccountWorkspace",
        });

        // AdAccount belongs to users
        SocialAssoAdaccountsWorkspaces.belongsTo(models["AppUsers"], {
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            foreignKey: "adAccountOwnerId",
            as: "adAccountOwner",
        });

        // Workspace belongs to users
        SocialAssoAdaccountsWorkspaces.belongsTo(models["AppUsers"], {
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            foreignKey: "workspaceOwnerId",
            as: "workspaceOwner",
        });
    };
    return SocialAssoAdaccountsWorkspaces;
};
