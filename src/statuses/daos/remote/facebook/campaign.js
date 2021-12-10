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
function bulkReadAds(sdk, data) {
    if(!sdk) {
        return { status: "failed", result: "sdk is required" };
    }

    
    console.log("----------------------------------------------");
    return new Promise(async (resolve, reject) => {
        let countOfRequests = 0;
        let countOfResponses = 0;

        const responses = [];
        const errors = [];

        // use batch api
        const apiBatch = await sdk.apiBatch();

        // Create requests for batch execution
        for (let i = 0; i < data.length; i++) {
            countOfRequests++;
            const { campaignId, adIds, adFields } = data[i];
            const url = `/adsss`; //?ids=${adIds.split(",")}&fields=${adFields.split(",")}
            const request = new APIRequest(campaignId, "GET", url);

            if(adIds && adIds.length) {
                request.addParam("ids",  adIds)
            }

            if(adFields && Object.keys(adFields).length) {
                request.addFields(adFields)
            }
            
            apiBatch.addRequest(
                request,
                (response) => {
                    countOfResponses++;
                    if(response.body) {
                        responses.push(response.body);
                    }

                    console.log(countOfRequests, "----------------------------------------------", countOfResponses);

                    if(countOfResponses >= countOfRequests) {
                        return resolve({responses, errors});
                    }
                },
                (response) => {
                    console.log(countOfRequests, "************************************************", countOfResponses);
                    countOfResponses++;
                    if(response.error) {
                        errors.push(response.error);
                    }

                    if(countOfResponses >= countOfRequests) {
                        return resolve({responses, errors});
                    }
                }
            );
        }

        try {
            await apiBatch.execute();
        } catch (error) {
            return reject(err)
        }
    });
}

module.exports = {
    bulkReadAds
};
