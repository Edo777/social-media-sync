const { LogoutActions } = require("./transactions");
const { workerData, parentPort } = require("worker_threads");
const { userId, platformUserId } = JSON.parse(workerData);

/** START PROCESSING */
(async () => {
    const errors = [];
    const t = new LogoutActions(userId, platformUserId);

    try {
        await t.execute();
    } catch (e) {
        errors.push(e.message || e);
    }

    parentPort.postMessage({ status: "finished", errors: errors });
})();
