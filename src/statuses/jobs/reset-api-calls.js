const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

/**
 * Call to dao and start statuses sync process for facebook
 */
async function facebookStatusesSync() {
    const resetApiCallsCode = getCode("CLEAR_API_CALLS");
    await LocalCronJobs.resetApiCallsCount(resetApiCallsCode);
}

module.exports = function (schedule) {
    schedule("59 * * * *", async function () {
        facebookStatusesSync();
    });
};
