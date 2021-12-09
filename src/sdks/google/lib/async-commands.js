const asyncCommands = ["batch_jobs/update_campaign_adgroup_ad_status"];

module.exports = function (command) {
    return asyncCommands.includes(command);
};
