"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const Cronjobs = utils.model(sequelize, "ImagesLoadCronjobs", {
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

    return Cronjobs;
};
