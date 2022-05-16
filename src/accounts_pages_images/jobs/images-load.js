const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

/**
 * Call to dao and start facebook ad accounts images load
 */
function facebookAccountsImagesLoad() {
    const facebookCronCode = getCode("FB_ACCOUNTS_IMAGES_LOAD");
    LocalCronJobs.execute("load-accounts-images", "facebook", facebookCronCode, 10).then();
}

/**
 * Call to dao and start facebook ad pages images load
 */
function facebookPagesImagesLoad() {
    const facebookCronCode = getCode("FB_PAGES_IMAGES_LOAD");
    LocalCronJobs.execute("load-pages-images", "facebook", facebookCronCode, 10).then();
}

module.exports = function (schedule) {
    schedule("*/2 * * * *", function () {
        facebookAccountsImagesLoad();
    });

    schedule("*/2 * * * *", function () {
        facebookPagesImagesLoad();
    });
};
