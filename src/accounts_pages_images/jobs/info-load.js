const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

/**
 * Call to dao and start facebook ad accounts images load
 */
function facebookAccountsInfoLoad() {
    const facebookCronCode = getCode("FB_ACCOUNTS_INFO_LOAD");
    LocalCronJobs.execute("load-accounts-info", "facebook", facebookCronCode).then();
}

/**
 * Call to dao and start facebook ad accounts images load
 */
 function facebookPagesInfoLoad() {
    const facebookCronCode = getCode("FB_PAGES_INFO_LOAD");
    LocalCronJobs.execute("load-pages-info", "facebook", facebookCronCode).then();
}

module.exports = function (schedule) {
    schedule("*/60 * * * *", function () {
        facebookAccountsInfoLoad();
    });

    schedule("*/60 * * * *", function () {
        facebookPagesInfoLoad();
    });
};
