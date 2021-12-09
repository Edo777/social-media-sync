const path = require("path");
const { Worker } = require("worker_threads");

const constantRemoteGooglePath = path.join(__dirname, "google");
const constantRemoteFacebookPath = path.join(__dirname, "facebook");

const actions = {
    remote: {
        google: {
            "actions-intime-login": path.join(constantRemoteGooglePath,"actions-intime-login-platform.js"),
        },
        facebook: {
            "statuses-sync": path.join(constantRemoteFacebookPath, "statuses-sync.js"),
        },
    },
};

/**
 * @typedef {(
 *  "reload-ads-statuses" |
 *  "activate-campaign" |
 *  "activate-campaign" |
 *  "remove-campaign" |
 *  "update-campaign"
 * )} ACTIONS
 * @returns
 */

/**
 * Create child process
 * @param {"google" | "facebook" | "twitter"} provider
 * @param { ACTIONS } action
 * @param {object | Array} dataToSend
 * @param {"remote" | "local"} from
 * @returns created child process
 */
module.exports = function (provider, action, dataToSend, from = "remote") {
    if (!actions[from][provider] || !actions[from][provider][action]) {
        console.log("PROCESS NOT EXISTS");
        return;
    }

    const modulePath = actions[from][provider][action];

    return new Promise((resolve, reject) => {
        const worker = new Worker(modulePath, { workerData: JSON.stringify(dataToSend) });

        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
};
