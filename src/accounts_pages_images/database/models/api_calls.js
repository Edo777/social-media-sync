"use strict";
const utils = require("../../shared/database/utils");

module.exports = (sequelize, DataTypes) => {
    const AccountsPagesApiCalls = utils.model(sequelize, "AccountsPagesApiCalls", {
        provider: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        providerUserId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    });

    return AccountsPagesApiCalls;
};
