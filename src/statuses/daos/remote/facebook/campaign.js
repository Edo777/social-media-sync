const { APIRequest } = require("../../../../sdks/facebook");

/**
 * Get ads of campaign
 * @param {any} sdk 
 * @param {[{
 *  campaignId: string,
 *  adIds: [string],
 *  adFields: [string]
 * }]} data 
 * @returns {Promise<[{
 *  responses: [[object]],
 *  errors: [[object]]
 * }]>}
 */
async function bulkReadAds(sdk, data) {
    if(!sdk) {
        return false;
    }

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
            const url = `/ads`;
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
                        if(response.body.data.length) {
                            for(d of response.body.data){
                                if(Array.isArray(d)) {
                                    responses.push(...d)
                                }else{
                                    responses.push(d)
                                }
                            }
                            
                        }
                    }

                    if(countOfResponses >= countOfRequests) {
                        return resolve({responses, errors});
                    }
                },
                (response) => {
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
            return reject(error)
        }
    });
}

module.exports = {
    bulkReadAds
};
