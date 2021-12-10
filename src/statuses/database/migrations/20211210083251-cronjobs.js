"use strict";
const utils = require("../../shared/database/utils");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return utils.migration(
            queryInterface,
            { name: "StatusSyncCronjobs", start: 1200 },
            {
                code: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                /** It will tell cronjob to start new cronjob */
                canLoad: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                },
            }
        );
    },

    down: (queryInterface, Sequelize) => {
        return utils.drop(queryInterface, "StatusSyncCronjobs");
    },
};
