"use strict";
const tariffs = require("./static/tariffs.json");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert("app_tariffs", tariffs, {});
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete("app_tariffs", {});
    },
};
