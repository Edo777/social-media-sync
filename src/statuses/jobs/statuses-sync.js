const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

/**
 * Call to dao and start statuses sync process for facebook
 */
async function facebookStatusesSync() {
    const facebookCronCode = getCode("STATUS_SYNC_FB");
    LocalCronJobs.syncStatuses("facebook", facebookCronCode).then();
}

/**
 * Call to dao and start statuses sync process for google
 */
 async function googleStatusesSync() {
    const googleCronCode = getCode("STATUS_SYNC_GLE");
    LocalCronJobs.syncStatuses("google", googleCronCode).then();
}

module.exports = function (schedule) {
    schedule("20 * * * * *", async function () {
        // facebookStatusesSync();
    });

    schedule("50 * * * * *", async function () {
        googleStatusesSync();
    });
};
