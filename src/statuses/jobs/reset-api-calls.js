const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

async function resetApiCallsCount() {
    const resetApiCallsCode = getCode("CLEAR_API_CALLS");
    await LocalCronJobs.resetApiCallsCount(resetApiCallsCode);
}

module.exports = function (schedule) {
    schedule("59 * * * *", async function () {
        resetApiCallsCount();
    });
};
