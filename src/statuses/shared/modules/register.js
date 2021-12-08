const express = require("express");
const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");
const moduleName = path.dirname(path.join(__dirname, "..", "..", ".env-example")).split(path.sep).pop();
const env = process.env.NODE_ENV || "development";
const dbConfig = require("../database/configs")[env];
dbConfig.multipleStatements = false;

// if (!process.isProd()) {
//     // const sqlFormatter = require("sql-formatter");
//     // dbConfig.logging = function (message) {
//     //     const sqlQuery = message.replace(/^Executing\s+\(.+\):\s*/, "");
//     //     if ("SELECT 1+1 AS result" == sqlQuery) {
//     //         console.log("Checking database connection ...");
//     //         return null;
//     //     }
//     //     const options = {
//     //         language: "sql",
//     //         indent: "  ",
//     //     };
//     //     const formattedQuery = sqlFormatter.format(sqlQuery, options);
//     //     const printMessage = `Executed SQL Query:\n${formattedQuery}\n`;
//     //     return console.log(printMessage.replace(/\n/g, "\n" + options.indent));
//     // };
// }

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
const db = {};

const mapModule = function (callback, onEnd) {
    return function (...args) {
        const returns = [];
        const root = path.join(__dirname, "..", "..");
            if (!fs.existsSync(root)) {
                throw new Error(`Module ${moduleName} not found.`);
            }

            returns.push(callback(moduleName, root, ...args));

        if ("function" == typeof onEnd) {
            return onEnd(returns, ...args);
        }
    };
};

/**
 * Register modules www.
 * @param {String} moduleName
 * @param {String} root
 * @param {express.Application} app
 */
const registerWww = mapModule(
    function (moduleName, root, app) {
        const publicPath = path.join(root, "public");
        const routesPath = path.join(root, "routes");

        const moduleRoutesPath = path.join("..", "..", "routes");
        const routePrefix = require(moduleRoutesPath).prefix;

        app.use(routePrefix, express.static(publicPath));
        return require(routesPath);
    },
    function (results, app) {
        const router = express.Router();
        results.forEach(function (row) {
            router.use(row.prefix, row.router);
        });

        app.use("/api/v1", router);
    }
);

/**
 * Register modules model.
 * @param {String} moduleName
 * @param {String} root
 */
const registerModels = mapModule(
    function (moduleName, root) {
        const basename = path.basename(__filename);
        const modelsPath = path.join(root, "database", "models");
        console.log(modelsPath)

        fs.readdirSync(modelsPath)
            .filter(function (file) {
                return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
            })
            .forEach(function (file) {
                const model =  require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes)
                db[model.name] = model;
            });
    },
    function (results) {
        Object.keys(db).forEach(function (modelName) {
            if (db[modelName].associate) {
                db[modelName].associate(db);
            }
        });

        db.sequelize = sequelize;
        db.Sequelize = Sequelize;
        return db;
    }
);

module.exports = {
    www: registerWww,
    models: registerModels,
};
