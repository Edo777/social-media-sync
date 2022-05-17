const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

async function resetApiCallsCount() {
    const resetApiCallsCode = getCode("RESET_API_CALLS");
    await LocalCronJobs.execute('reset-api-calls', 'facebook', resetApiCallsCode);
}

module.exports = function (schedule) {
    schedule("59 * * * *", async function () {
        resetApiCallsCount();
    });
};
