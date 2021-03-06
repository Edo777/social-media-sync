const { StatusSync } = require("./transactions");
const { workerData, parentPort } = require("worker_threads");
const { CRON_CODE } = workerData;

/** START PROCESSING */
(async () => {
    const errors = [];

    const { status, result } = await StatusSync.execute();

    if (status !== "success") {
        errors.push({ status, result });
    }

    parentPort.postMessage({ status: "finished", errors: errors });
})();
