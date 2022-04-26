const { ImagesLoadCronjobs, Sequelize } = require("../../shared/database/models");
const AdAccountsDao = require("./ad_accounts");

const REMOTE_DAOS = {
    facebook : require("../remote/facebook/ad-account")
}

/**
 * Load images and set to database
 * @param {"facebook" | "google"} platform
 * @returns 
 */
async function loadAccountsImages(platform) {
    if(!REMOTE_DAOS.hasOwnProperty(platform)) {
        return
    }

    const adAccounts = await AdAccountsDao.loadAccountsNeededImagesLoad(platform);

    if(!adAccounts || !adAccounts.length) {
        return;
    }
    
    await REMOTE_DAOS[platform].setAdAccountsPictures(adAccounts);
    await AdAccountsDao.setAdAccountsImagesToDatabase(adAccounts);
}

/**
 * load images
 * @param {"facebook" | "google"} platform
 * @param {number} CRON_CODE
 * @returns
 */
async function loadImages(platform, CRON_CODE) {
    if(!["facebook", "google"].includes(platform)) {
        return
    }

    const canWork = await canStartJob(CRON_CODE);

    if(!canWork) {
        return
    }

    // Start cronjob
    await updateJob(CRON_CODE, false);
    
    // Load images and set to database
    await loadAccountsImages(platform);
    
    // end cronjob
    await updateJob(CRON_CODE, true);
}

/**
 * Can start cronjob or wait
 * @param {number} JOB_CODE
 * @returns
 */
async function canStartJob(JOB_CODE) {
    const cronRow = await ImagesLoadCronjobs.findOne({
        where: { code: JOB_CODE },
        attributes: ["canLoad"],
    });

    if (!cronRow) {
        return true;
    }

    return cronRow.canLoad;
}

/**
 * Update job canLoad or not
 * @param {number} JOB_CODE
 * @param {boolean} finished
 */
async function updateJob(JOB_CODE, finished) {
    const [instance, isNewRecord] = await ImagesLoadCronjobs.findOrCreate({
        where: { code: JOB_CODE },
    });

    await instance.update({ canLoad: finished });
}

module.exports = {
    canStartJob,
    updateJob,
    loadImages
};
