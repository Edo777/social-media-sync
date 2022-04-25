require("./shared/bootload");
const models = require("./shared/database/models");

module.exports = async function (callback) {
    try {
        await models.sequelize.authenticate();
        callback();
    } catch (err) {
        console.error("Something went wrong with database...", err, `${__filename}:32`);
    }
};
