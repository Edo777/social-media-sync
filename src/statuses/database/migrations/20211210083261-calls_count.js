"use strict";
const utils = require("../../shared/database/utils");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return utils.migration(
            queryInterface,
            { name: "StatusSyncApiCalls", start: 1 },
            {
                provider: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                providerUserId: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: "load_statuses"
                },
                count: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0
                }
            }
        );
    },

    down: (queryInterface, Sequelize) => {
        return utils.drop(queryInterface, "StatusSyncApiCalls");
    },
};
