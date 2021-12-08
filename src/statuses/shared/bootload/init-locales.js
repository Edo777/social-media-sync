const path = require("path");

const locales = ["en", "ru", "hy"];
const resources = {};

locales.forEach(function (locale) {
    resources[locale] = resources[locale] || {};

    const msgPath = path.join(
        __dirname,
        "..",
        "..",
        "locales",
        `${locale}.json`
    );
    const translates = require(msgPath);

    resources[locale] = {
        ...resources[locale],
        ...translates,
    };
});

/**
 * Translate
 * @param {string} key 
 * @param {[string]]} values 
 * @returns 
 */
global.__tCompany = function (key, values = {}) {
    // TODO: get locale from giver header -> req.headers["x-app-language"]
    const locale = "en";

    if (!resources.hasOwnProperty(locale)) {
        return "";
    }

    if (!resources[locale].hasOwnProperty(key)) {
        return "";
    }

    let message = resources[locale][key];
    Object.keys(values).forEach(function (valKey) {
        message = message.replace(new RegExp(valKey, "g"), values[valKey]);
    });

    return message;
};
