const workerTasks = require("../workers/remote");

function testJob() {
    workerTasks("facebook", "statuses-sync", {}).then();
}

module.exports = function (schedule) {
    schedule("* * * * * *", async function () {
        testJob()
    });
};
