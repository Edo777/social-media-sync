const { ImagesLoadCronjobs } = require("../../shared/database/models");
const { Err } = require("../../utils")


const AdAccountsDao = require("./ad_accounts");
const PagesDao = require("./pages");

const REMOTE_ACCOUNT_DAOS = {
    facebook : require("../remote/facebook/ad-account")
}

const REMOTE_PAGE_DAOS = {
    facebook : require("../remote/facebook/page")
}

/**
 * Limit items
 * @param {[object]} pages 
 * @param {number} limit 
 * @returns 
 */
function limitItems(items, limit) {
    try {
        const list = {};

        for(let i = 0; i < items.length; i++) {
            const tokenUserId = items[i].platformUserId;

            if(!list.hasOwnProperty(tokenUserId)) {
                list[tokenUserId] = 0;
            }

            if(list[tokenUserId] >= limit) {
                items[i] = null;
            } else {
                list[tokenUserId]++;
            }
        }

        return items.filter(it => it !== null);
    } catch (error) {
        Err.write(error);
    }
}

/**
 * Load images and set to database
 * @param {"facebook" | "google"} platform
 * @param {number} limitForToken
 * @returns 
 */
async function loadAccountsImages(platform, limitForToken=null) {
    try {
        if(!REMOTE_ACCOUNT_DAOS.hasOwnProperty(platform)) {
            return
        }
    
        let adAccounts = await AdAccountsDao.loadAccountsNeededImagesLoad(platform);
    
        if(!adAccounts || !adAccounts.length) {
            return;
        }
    
        // Integrate limit for per user
        if(limitForToken) {
            adAccounts = limitItems(adAccounts, limitForToken);
        }
        
        await REMOTE_ACCOUNT_DAOS[platform].setAdAccountsPictures(adAccounts);
        await AdAccountsDao.setAdAccountsImagesToDatabase(adAccounts);
    } catch (error) {
        Err.write(error);
    }
}

/**
 * Load images and set to database
 * @param {"facebook" | "google"} platform
 * @param {number} limitForToken
 * @returns 
 */
 async function loadPagesImages(platform, limitForToken=null) {
    try {
        if(!REMOTE_PAGE_DAOS.hasOwnProperty(platform)) {
            return
        }
    
        let pages = await PagesDao.loadPagesNeededImagesLoad(platform);
    
        if(!pages || !pages.length) {
            return;
        }
    
        // Integrate limit for per user
        if(limitForToken) {
            pages = limitItems(pages, limitForToken);
        }
        
        await REMOTE_PAGE_DAOS[platform].setPagesPictures(pages);
        await PagesDao.setPagesImagesToDatabase(pages);
    } catch (error) {
        Err.write(error);
    }
}

/**
 * Load images and set to database
 * @param {"facebook" | "google"} platform
 * @param {number} limitForToken
 * @returns 
 */
 async function loadAccountsInfo(platform, limitForToken=null) {
    try {
        if(!REMOTE_ACCOUNT_DAOS.hasOwnProperty(platform)) {
            return
        }
    
        let adAccounts = await AdAccountsDao.loadAccountsNeededInfoLoad(platform);
    
        if(!adAccounts || !adAccounts.length) {
            return;
        }
    
        // Integrate limit for per user
        if(limitForToken) {
            adAccounts = limitItems(adAccounts, limitForToken);
        }
        
        const resolvedAccounts = await REMOTE_ACCOUNT_DAOS[platform].getAdAcccountsInformation(adAccounts);
        if(resolvedAccounts && resolvedAccounts.length) {
            await AdAccountsDao.setAdAccountsInformationToDatabase(resolvedAccounts);
        }
    } catch (error) {
        Err.write(error);
    }
}

/**
 * Load images and set to database
 * @param {"facebook" | "google"} platform
 * @param {number} limitForToken
 * @returns 
 */
 async function loadPagesInfo(platform, limitForToken=null) {
    try {
        if(!REMOTE_PAGE_DAOS.hasOwnProperty(platform)) {
            return
        }
    
        let pages = await PagesDao.loadPagesNeededInfoLoad(platform);
    
        if(!pages || !pages.length) {
            return;
        }
    
        // Integrate limit for per user
        if(limitForToken && pages.length > limitForToken) {
            pages = limitItems(pages, limitForToken);
        }
        
        const resolvedPages = await REMOTE_PAGE_DAOS[platform].getPagesInformation(pages);
        if(resolvedPages && resolvedPages.length) {
            await PagesDao.setPagesInformationToDatabase(resolvedPages);
        }
    } catch (error) {
        Err.write(error);
    }
}


/**
 * High order function for cronjobs
 * @param {Function} processCB 
 * @param {"facebook" | "google"} platform
 * @param {number} CRON_CODE
 * @param {number} limitForPerToken
 * @returns 
 */
async function processCronjob(processCB, platform, CRON_CODE, limitForPerToken=null) {
    try {
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
        await processCB(platform, limitForPerToken);
        
        // end cronjob
        await updateJob(CRON_CODE, true);
    } catch (error) {
        Err.write(error);

        // end cronjob
        await updateJob(CRON_CODE, true);
    }
}

/**
 * load images
 * @param {"load-accounts-images" | "load-accounts-info" | "load-pages-images" | "load-pages-info"} task
 * @param {"facebook" | "google"} platform
 * @param {number} CRON_CODE
 * @param {number} limitForPerToken
 * @returns
 */
async function execute(task, platform, CRON_CODE, limitForPerToken=null) {
    if(task === "load-accounts-images") {
        await processCronjob(loadAccountsImages, platform, CRON_CODE, limitForPerToken);
    }

    if(task === "load-accounts-info") {
       await processCronjob(loadAccountsInfo, platform, CRON_CODE, limitForPerToken)
    }

    if(task === "load-pages-images") {
        await processCronjob(loadPagesImages, platform, CRON_CODE, limitForPerToken)
    }

    if(task === "load-pages-info") {
        await processCronjob(loadPagesInfo, platform, CRON_CODE, limitForPerToken)
    }
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
    execute
};
