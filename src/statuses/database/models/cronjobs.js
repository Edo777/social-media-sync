"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const StatusSyncCronjobs = utils.model(sequelize, "StatusSyncCronjobs", {
        code: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        /** It will tell cronjob to start new cronjob */
        canLoad: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    });

    return StatusSyncCronjobs;
};
