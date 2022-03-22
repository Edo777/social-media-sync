"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const StatusSyncCronjobs = utils.model(sequelize, "StatusSyncApiCalls", {
        provider: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        providerUserId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "load_statuses"
        },
        count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    });

    return StatusSyncCronjobs;
};
