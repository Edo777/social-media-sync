const { LocalCronJobs } = require("../daos");
const { getCode } = require("./PROCESS_CODES");

/**
 * Call to dao and start facebook ad accounts images load
 */
async function facebookAccountsImagesLoad() {
    const facebookCronCode = getCode("FB_ACCOUNTS_IMAGES_LOAD");
    LocalCronJobs.loadImages("facebook", facebookCronCode).then();
}

module.exports = function (schedule) {
    schedule("*/20 * * * *", async function () {
        facebookAccountsImagesLoad();
    });
};
