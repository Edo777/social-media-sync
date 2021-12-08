function testJob() {
    console.log("JOB RUN 2");
}

module.exports = function (schedule) {
    schedule("* * * * * *", async function () {
        testJob()
    });
};
