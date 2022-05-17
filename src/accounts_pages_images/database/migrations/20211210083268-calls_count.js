"use strict";
const utils = require("../../shared/database/utils");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return utils.migration(
            queryInterface,
            { name: "AccountsPagesApiCalls", start: 1 },
            {
                provider: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                providerUserId: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING,
                    allowNull: false,
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
        return utils.drop(queryInterface, "AccountsPagesApiCalls");
    },
};
