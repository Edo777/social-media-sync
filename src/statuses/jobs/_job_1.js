function testJob() {
    console.log("JOB RUN");
}

module.exports = function (schedule) {
    schedule("* * * * * *", async function () {
        testJob()
    });
};
