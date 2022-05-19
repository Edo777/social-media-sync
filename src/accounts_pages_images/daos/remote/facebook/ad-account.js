const { getSdkByRemoteUser, getSdkByNeededData, getAccessTokensByCondition } = require("../../global/sdk");
const { User, AdAccount } = require("../../../../sdks/facebook");
const _ = require("lodash");

const LocalApiCallsDao = require("../../local/api_calls");

function convertAccountStatus(code) {
    const statuses = {
        1: "ACTIVE",
        2: "DISABLED",
        3: "UNSETTLED",
        7: "PENDING_RISK_REVIEW",
        8: "PENDING_SETTLEMENT",
        9: "IN_GRACE_PERIOD",
        100: "PENDING_CLOSURE",
        101: "CLOSED",
        201: "ANY_ACTIVE",
        202: "ANY_CLOSED",
    };

    return statuses[code];
}

function convertDisableReason(code) {
    const reasons = {
        0: "NONE",
        1: "ADS_INTEGRITY_POLICY",
        2: "ADS_IP_REVIEW",
        3: "RISK_PAYMENT",
        4: "GRAY_ACCOUNT_SHUT_DOWN",
        5: "ADS_AFC_REVIEW",
        6: "BUSINESS_INTEGRITY_RAR",
        7: "PERMANENT_CLOSE",
        8: "UNUSED_RESELLER_ACCOUNT",
        9: "UNUSED_ACCOUNT",
    };

    return reasons[code];
}

/**
 * Set taked result to accounts
 * @param {[{ id: string, ownerId: string }]} accounts
 * @param {object} result  => {[adAccountOwnerId] : "logo" | "error"}
 * @returns {[{ id: string, ownerId: string , logo: string }]}
 */
function setResultToAccounts(accounts, result, successLoadAccountIds=null) {
    if (!Object.keys(result).length) {
        return;
    }

    accounts.forEach((account) => {
        const owner = account["adAccountOwnerId"];
        const accountId = account["adAccountId"];
        if (result.hasOwnProperty(owner)) {
            if(!account["adAccountIcon"] || ["error", "not-loaded"].includes(account["adAccountIcon"]))  {
                account["adAccountIcon"] = result[owner];
            }

            if(!["error", "not-loaded"].includes(account["adAccountIcon"]) && successLoadAccountIds && !successLoadAccountIds[accountId]) {
                successLoadAccountIds[accountId] = true;
            }
        }
    });

    return accounts;
}

/**
 * Batch Load pictures of accounts
 * @param {[{ id: string, ownerId }]} adAccounts
 * @param {any} sdk
 * @returns {{ownerId: "logo" | "error"} | [{ id: string, ownerId, logo: string }]}
 */
async function getAccountsPicturesBatch(adAccounts, sdk, setResultToAccountsCB = null) {
    const groupedAdAccounts = _.groupBy(adAccounts, "adAccountOwnerId");

    const picturePromises = [];
    const adAccountsOwners = [];
    const result = {};

    Object.keys(groupedAdAccounts).forEach((owner) => {
        adAccountsOwners.push(owner);
        result[owner] = "";
        picturePromises.push(sdk.getPicture(owner));

        if(sdk && sdk.authData.facebookUserId) {
            LocalApiCallsDao.createApiCall(sdk.authData.facebookUserId.toString(), {
                provider: "facebook",
                count: 1,
                description: "load_accounts_images"
            });
        }
    });

    // Get pictures of accounts
    if (picturePromises.length) {
        const promiseResults = await Promise.allSettled(picturePromises);

        // Set result depending from promise status
        promiseResults.forEach((res, i) => {
            const owner = adAccountsOwners[i];
            if (result[owner] === "" && res.status === "fulfilled") {
                result[owner] = res.value;
            }else{
                result[owner] = "error";
            }
        });
    }

    if (setResultToAccountsCB) {
        setResultToAccountsCB(adAccounts, result);
    }

    return result;
}

/**
 * Set adAccountIcon in ad Accounts
 * @param {[{ id: string, remoteId: string, ownerId: string, platformUserId: string }]} adAccounts
 * @param {FacebookSDK} sdk
 */
async function setAdAccountsPictures(adAccounts, sdk = null) {
    if (!adAccounts || !adAccounts.length) {
        return;
    }

    if (sdk && sdk.authData && sdk.authData.facebookAccessToken) {
        return await getAccountsPicturesBatch(adAccounts, sdk, setResultToAccounts);
    }

    // Group accounts by remote user
    const groupedAdAccounts = _.groupBy(adAccounts, "platformUserId");
    const successLoadAccountIds = {};    

    for (const remoteUserId in groupedAdAccounts) {
        // Get sdk for remote user
        const sdk = await getSdkByRemoteUser("facebook", remoteUserId);

        // Filter accounts for which we need load icon
        const accountsLoadPicturesFor = groupedAdAccounts[remoteUserId].filter(acc => !successLoadPageIds[acc.adAccountId]);

        if (accountsLoadPicturesFor.length && sdk && sdk.authData && sdk.authData.facebookAccessToken) {
            // Get pictures result
            const result = await getAccountsPicturesBatch(groupedAdAccounts[remoteUserId], sdk);

            // Set that result to adAccounts original array
            setResultToAccounts(adAccounts, result, successLoadAccountIds);
        }
    }
}

/**
 * TODO: Get ad accounts facebook
 * @param {FacebookSDK} sdk
 * @param {{ set , limit }} pictureOptions
 * @returns
 */
async function loadAdAccounts(sdk, pictureOptions = { set: false, limit: null }) {
    try {
        if(sdk && sdk.authData.facebookUserId) {
            LocalApiCallsDao.createApiCall(sdk.authData.facebookUserId.toString(), {
                provider: "facebook",
                count: 1,
                description: "load_accounts"
            }).then();
        }

        const user = sdk.instance(User, { id: sdk.authData.facebookUserId });

        const response = await user.getAdAccounts([
            AdAccount.Fields.id,
            AdAccount.Fields.account_status,
            AdAccount.Fields.disable_reason,
        ]);

        const adAccounts = response.map((item) => ({
            platformUserId: sdk.authData.facebookUserId.toString(),
            id: item._data.id,
            status: convertAccountStatus(item._data.account_status),
            disableReason: convertDisableReason(item._data.disable_reason),
        }));

        // Load pictures for specific limit
        if (pictureOptions.set) {
            let accountsToGetPictures = adAccounts;

            if (pictureOptions.limit) {
                accountsToGetPictures = adAccounts.slice(0, pictureOptions.limit);
            }

            await setAdAccountsPictures(accountsToGetPictures, sdk);
        }

        return adAccounts;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/**
 * Compare and return only accounts which have need to update
 * @param {[{
 *  platformUserId: string,
 *  status: string,
 *  disableReason: string,
 *  id: string
 * }]} remoteAdAccounts 
 * @param {[{
 *  id: number,
 *  adAccountId: string,
 *  status: string,
 *  disableReason: string,
 *  platformUserId: string
 * }]} localAdAccounts 
 * @returns 
 */
async function compareRemoteAndLocalAdAccounts(remoteAdAccounts, localAdAccounts) {
    if(!remoteAdAccounts.length || !localAdAccounts.length) {
        return [];
    }

    const result = [];
    const groupedLocalAccounts = _.groupBy(localAdAccounts, "platformUserId");
    for(let i = 0; i < remoteAdAccounts.length; i++) {
        const { platformUserId, status, disableReason, id: remoteId} = remoteAdAccounts[i];
        if(!groupedLocalAccounts.hasOwnProperty(platformUserId)) {
            continue;
        }

        const neededCurrentUserAccounts = groupedLocalAccounts[platformUserId].filter(acc => acc !== null);

        if(!neededCurrentUserAccounts.length) {
            continue;
        }

        const neededAccountIndex = neededCurrentUserAccounts.findIndex(acc => acc.adAccountId === remoteId);

        if(neededAccountIndex < 0) {
            continue;
        }

        const neededLocalAccount = neededCurrentUserAccounts[neededAccountIndex];

        if(neededLocalAccount && neededLocalAccount.status !== status) {
            neededLocalAccount.status = status;
            neededLocalAccount.disableReason = disableReason;
            result.push(neededLocalAccount);

            groupedLocalAccounts[platformUserId][neededAccountIndex] = null;
        }
    }

    return result;
}

/**
 * Get info from remote server and set to update in our db
 * @param {[object]} adAccounts
 * @returns {[object]} accounts to update
 */
async function getAdAcccountsInformation(adAccounts) {
    // Set unique list for remote userIds
    const platformUserIds = Array.from(new Set(adAccounts.map(a => a.userId)));

    // Get tokens
    const tokensList = await getAccessTokensByCondition({
        condition: {
            facebookIsLogged: true,
            facebookUserId: platformUserIds,
        },
        attributes: ["facebookUserId", "facebookAccessToken"]
    });

    if(!tokensList || !tokensList.length) {
        return
    }

    // Group tokens by remote user
    const tokensGroupedByRemoteUser = _.groupBy(tokensList, "facebookUserId");
    const sdks = {}

    // Filter accounts which accesstoken is exists
    for(let i = 0; i < adAccounts.length; i++) {
        const rUserId = adAccounts[i].platformUserId;
        if(tokensGroupedByRemoteUser.hasOwnProperty(rUserId)) {

            // set user
            if(!sdks.hasOwnProperty(rUserId)) {
                sdks[rUserId] = {};
            }

            // Get sdk for user
            if(!sdks[rUserId].sdk) {
                const token = tokensGroupedByRemoteUser[rUserId][0].facebookAccessToken;
                sdks[rUserId].sdk = await getSdkByNeededData("facebook", { accessToken: token });

                if(sdks[rUserId].sdk) {
                    sdks[rUserId].sdk.authData = { facebookUserId: rUserId }
                }
            }
        }
    }

    const accountsLoadPromises = [];
    Object.keys(sdks).forEach(remoteUserId => {
        accountsLoadPromises.push(loadAdAccounts(sdks[remoteUserId].sdk));
    });

    let resultOfAdccounts = await Promise.allSettled(accountsLoadPromises);
    resultOfAdccounts = resultOfAdccounts.filter(res => res.status === "fulfilled")

    if(!resultOfAdccounts.length) {
        return [];
    }

    const successResult = [];
    resultOfAdccounts.forEach(resArray => {
        successResult.push(...resArray.value);
    })

    return await compareRemoteAndLocalAdAccounts(successResult, adAccounts);
}

module.exports = {
    setAdAccountsPictures,
    getAdAcccountsInformation
};


