const { APIRequest } = require("../../../../sdks/facebook");

/**
 * Get ads of campaign
 * @param {any} sdk 
 * @param {[{
 *  campaignId: string,
 *  adIds: [string],
 *  adFields: [string]
 * }]} data 
 * @returns 
 */
async function bulkReadAds(sdk, data) {
    if(!sdk) {
        return { status: "failed", result: "sdk is required" };
    }

    return new Promise(async (resolve, reject) => {
            // use batch api
            const apiBatch = await sdk.apiBatch();

            // Create requests for batch execution
            for (let i = 0; i < data.length; i++) {
                const { campaignId, adIds, adFields } = data[i];
                const url = `${campaignId}/ads`; //?ids=${adIds.split(",")}&fields=${adFields.split(",")}
                const request = new APIRequest("", "GET", url);

                if(adIds && adIds.length) {
                    request.addParam("ids",  adIds)
                }

                if(adFields && Object.keys(adFields).length) {
                    // request.addFields(adFields)
                    request.addField('status')
                }
                        
                apiBatch.addRequest(
                    request,
                    (response) => console.log(response.error, "--------------------"),
                    (response) => console.log(response.body, "-----------------------")
                );
            }

            try {
                const result = await apiBatch.execute();
                return resolve(result);
            } catch (error) {
                return reject(err)
            }
    });
}

module.exports = {
    bulkReadAds
};
