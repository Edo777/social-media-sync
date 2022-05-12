const { getSdkByRemoteUser, getSdkByNeededData, getAccessTokensByCondition } = require("../../global/sdk");
const { User, Page } = require("../../../../sdks/facebook");
const _ = require("lodash");

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
 * Set taked result to pages
 * @param {[{ id: string, pageId: string }]} pages
 * @param {object} result  => {[pageId] : "logo" | "error"}
 * @returns {[{ id: string, pageId: string , pageIcon: string }]}
 */
function setResultToPages(pages, result, successLoadPageIds=null) {
    if (!Object.keys(result).length) {
        return;
    }

    pages.forEach((page) => {
        const pageId = page["pageId"];
        if (result.hasOwnProperty(pageId)) {
            if(!page["pageIcon"] || page["pageIcon"] == "error") {
                page["pageIcon"] = result[pageId];
            }

            if(page["pageIcon"] !== "error" && successLoadPageIds && !successLoadPageIds[pageId]) {
                successLoadPageIds[pageId] = true;
            }
        }
    });

    return pages;
}

/**
 * Batch Load pictures of accounts
 * @param {[{ id: string, ownerId }]} adAccounts
 * @param {any} sdk
 * @returns {{ownerId: "logo" | "error"} | [{ id: string, ownerId, logo: string }]}
 */
async function getPagesPicturesBatch(pages, sdk, setResultToPagesCB = null) {
    const groupedPages = _.groupBy(pages, "pageId");

    const picturePromises = [];
    const pageIds = [];
    const result = {};

    Object.keys(groupedPages).forEach((pageId) => {
        pageIds.push(pageId);
        result[pageId] = "";
        picturePromises.push(sdk.getPicture(pageId));
    });

    // Get pictures of accounts
    if (picturePromises.length) {
        const promiseResults = await Promise.allSettled(picturePromises);

        // Set result depending from promise status
        promiseResults.forEach((res, i) => {
            const pageId = pageIds[i];
            if (result[pageId] === "" && res.status === "fulfilled") {
                result[pageId] = res.value;
            } else{
                result[pageId] = "error";
            }
        });
    }

    if (setResultToPagesCB) {
        setResultToPagesCB(pages, result);
    }

    return result;
}

/**
 * Set adAccountIcon in ad Accounts
 * @param {[{ id: string, remoteId: string, ownerId: string, platformUserId: string }]} adAccounts
 * @param {FacebookSDK} sdk
 */
async function setPagesPictures(pages, sdk = null) {
    if (!pages || !pages.length) {
        return;
    }

    if (sdk && sdk.authData && sdk.authData.facebookAccessToken) {
        return await getPagesPicturesBatch(pages, sdk, setResultToPages);
    }

    // Group pages by remote user
    const groupedPages = _.groupBy(pages, "platformUserId");
    const successLoadPageIds = {};

    for (const remoteUserId in groupedPages) {
        // Get sdk for remote user
        const sdk = await getSdkByRemoteUser("facebook", remoteUserId);
        const pagesLoadPicturesFor = groupedPages[remoteUserId].filter(page => !successLoadPageIds[page.pageId]);
        if (pagesLoadPicturesFor.length && sdk && sdk.authData && sdk.authData.facebookAccessToken) {
            // Get pictures result
            const result = await getPagesPicturesBatch(pagesLoadPicturesFor, sdk);

            // Set that result to pages original array
            setResultToPages(pages, result, successLoadPageIds);
        }
    }
}

/**
 * TODO: Get ad accounts facebook
 * @param {FacebookSDK} sdk
 * @returns
 */
async function loadPages(sdk) {
    try {
        const user = sdk.instance(User, { id: sdk.authData.facebookUserId });

        const response = await user.getAccounts([
            Page.Fields.id,
            Page.Fields.promotion_eligible,
            Page.Fields.promotion_ineligible_reason,
        ]);

        const pages = response.map((item) => ({
            platformUserId: sdk.authData.facebookUserId.toString(),
            id: item._data.id,
            promotionEligible: item._data.promotion_eligible,
            promotionIneligibleReason: item._data.promotion_ineligible_reason,
        }));

        return pages;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/**
 * Compare and return only pages which have need to update
 * (compare promotionEligible and promotionIneligibleReason)
 * @param {[{
 *  platformUserId: string,
 *  promotionEligible: string,
 *  promotionIneligibleReason: string,
 *  id: string
 * }]} remoteAdAccounts 
 * @param {[{
 *  id: number,
 *  pageId: string,
 *  promotionEligible: string,
 *  promotionIneligibleReason: string,
 *  platformUserId: string
 * }]} localAdAccounts 
 * @returns 
 */
async function compareRemoteAndLocalPages(remotePages, localPages) {
    if(!remotePages.length || !localPages.length) {
        return [];
    }

    const result = [];
    const groupedLocalPages = _.groupBy(localPages, "platformUserId");
    for(let i = 0; i < remotePages.length; i++) {
        const { platformUserId, promotionEligible, promotionIneligibleReason, id: remoteId} = remotePages[i];
        if(!groupedLocalPages.hasOwnProperty(platformUserId)) {
            continue;
        }

        // Depending from Link L1
        const neededCurrentUserPages = groupedLocalPages[platformUserId].filter(pg => pg !== null);

        if(!neededCurrentUserPages.length) {
            continue;
        }

        const neededPageIndex = neededCurrentUserPages.findIndex(pg => pg.pageId === remoteId);

        if(neededPageIndex < 0) {
            continue;
        }

        const neededLocalPage = neededCurrentUserPages[neededPageIndex];

        if(neededLocalPage && neededLocalPage.promotionEligible !== promotionEligible) {
            neededLocalPage.promotionEligible = promotionEligible;
            neededLocalPage.promotionIneligibleReason = promotionIneligibleReason;
            result.push(neededLocalPage);

            // L1
            groupedLocalPages[platformUserId][neededPageIndex] = null;
        }
    }

    return result;
}

/**
 * Get info from remote server and set to update in our db
 * @param {[object]} pages
 * @returns {[object]} pages to update
 */
async function getPagesInformation(pages) {
    // Set unique list for remote userIds
    const platformUserIds = Array.from(new Set(pages.map(p => p.platformUserId)));

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

    // Filter pages which accesstoken is exists and set sdks
    for(let i = 0; i < pages.length; i++) {
        const rUserId = pages[i].platformUserId;
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

    const pagesLoadPromises = [];
    Object.keys(sdks).forEach(remoteUserId => {
        pagesLoadPromises.push(loadPages(sdks[remoteUserId].sdk));
    });

    let resultOfPages = await Promise.allSettled(pagesLoadPromises);
    resultOfPages = resultOfPages.filter(res => res.status === "fulfilled")

    if(!resultOfPages.length) {
        return [];
    }

    const successResult = [];
    resultOfPages.forEach(resArray => {
        successResult.push(...resArray.value);
    })

    return await compareRemoteAndLocalPages(successResult, pages);
}

module.exports = {
    setPagesPictures,
    getPagesInformation
};


