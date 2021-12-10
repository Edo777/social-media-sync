const { StatusSyncCronjobs } = require("../../shared/database/models");
const workerTasks = require("../../workers/remote");

/**
 * Sync statuses
 * @param {"facebook" | "google"} platform
 * @param {number} CRON_CODE
 * @returns
 */
async function syncStatuses(platform, CRON_CODE) {
    if(!["facebook", "google"].includes(platform)) {
        return
    }

    const canWork = await canStartJob(CRON_CODE);

    if(!canWork) {
        return
    }

    // Start cronjob
    await updateJob(CRON_CODE, false);
    
    // start worker
    await workerTasks(platform, "statuses-sync", {});
    
    // end cronjob
    await updateJob(CRON_CODE, true);
}

/**
 * Can start cronjob or wait
 * @param {number} JOB_CODE
 * @returns
 */
async function canStartJob(JOB_CODE) {
    const cronRow = await StatusSyncCronjobs.findOne({
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
    const [instance, isNewRecord] = await StatusSyncCronjobs.findOrCreate({
        where: { code: JOB_CODE },
    });

    await instance.update({ canLoad: finished });
}

module.exports = {
    syncStatuses,
    canStartJob,
    updateJob,
};
