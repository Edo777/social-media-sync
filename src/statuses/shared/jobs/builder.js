const cron = require("node-cron");

const CronJobBuilder = function () {
    this.frequency = "";
    this.arguments = {};
    this.callback = function () {};
};

CronJobBuilder.prototype.setFrequency = function (frequencyProd, frequencyDev = "") {
    if (!frequencyDev) {
        frequencyDev = frequencyProd;
    }

    this.frequency = process.isProd() ? frequencyProd : frequencyDev;
    return this;
};

CronJobBuilder.prototype.setCallback = function (callback) {
    this.callback = callback;
    return this;
};

CronJobBuilder.prototype.setArguments = function (args) {
    this.arguments = args || {};
    return this;
};

CronJobBuilder.prototype.build = function () {
    const params = this.arguments || {};
    params.timezone = process.env.TZ;

    return cron.schedule(this.frequency, this.callback, params);
};

CronJobBuilder.make = function (frequencyProd, frequencyDev, callback) {
    if ("function" == typeof frequencyDev) {
        callback = frequencyDev;
        frequencyDev = frequencyProd;
    }

    return new CronJobBuilder()
        .setFrequency(frequencyProd, frequencyDev)
        .setCallback(callback)
        .build();
};

module.exports = CronJobBuilder;
