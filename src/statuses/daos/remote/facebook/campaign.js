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
function bulkReadAds(sdk, data) {
    return new Promise(async (resolve, reject) => {
        const responses = [];
        const errors = [];

        if(!sdk) {
            return resolve({responses, errors});
        }

        // use batch api
        const apiBatch = await sdk.apiBatch();

        // Create requests for batch execution
        for (let i = 0; i < data.length; i++) {
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
                },
                (response) => {
                    if(response.error) {
                        errors.push(response.error.message);
                    }
                }
            );
        }

        try {
            await apiBatch.execute();
            console.log(errors, "------------");
            return resolve({responses, errors});
        } catch (error) {
            console.log("ERROR IN TIME EXECUTION OR BATCH");
            return resolve({responses, errors});
        }
    });
}

module.exports = {
    bulkReadAds
};
