const path = require("path");
const fs = require("fs");
const builder = require("./builder");

module.exports = function (moduleName) {
    const jobDir = path.join(__dirname, "..", "..", "jobs", "index.js");
    if (fs.existsSync(jobDir)) {
        let jobList = require(jobDir);
        if (!Array.isArray(jobList)) {
            jobList = [jobList];
        }

        if (jobList.length == 0) {
            console.error("There is no any jobs registered.");
        }

        const count = {
            success: 0,
            failed: 0,
        };

        jobList.forEach(function (register) {
            if ("function" == typeof register) {
                register(builder.make);
                ++count.success;
            } else {
                ++count.failed;
            }
        });

        console.error(`Job registrations [success: ${count.success}, failed: ${count.failed}].`);
    }
};
