"use strict";
const { password: hashPass } = require("../../../../shared/utils");

const users = require("./static/user.json");
const defaultConfigs = require("./static/default-user-config.json");

for (let i = 0; i < users.length; ++i) {
    users[i].password = hashPass.hash(users[i].password);
    users[i].configs = JSON.stringify(defaultConfigs);
}

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert("app_users", users);
    },

    down: (queryInterface, Sequelize) => {
        /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    },
};
