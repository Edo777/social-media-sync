const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

/**
 * Call to dao and start facebook ad accounts images load
 */
async function facebookAccountsInfoLoad() {
    const facebookCronCode = getCode("FB_ACCOUNTS_INFO_LOAD");
    LocalCronJobs.execute("load-accounts-info", "facebook", facebookCronCode).then();
}

module.exports = function (schedule) {
    schedule("*/60 * * * *", async function () {
        facebookAccountsInfoLoad();
    });
};
