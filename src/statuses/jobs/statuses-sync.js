const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

/**
 * Call to dao and start statuses sync process for facebook
 */
async function facebookStatusesSync() {
    const facebookCronCode = getCode("STATUS_SYNC");
    LocalCronJobs.syncStatuses("facebook", facebookCronCode).then();
}

module.exports = function (schedule) {
    schedule("60 * * * * *", async function () {
        facebookStatusesSync()
    });
};
