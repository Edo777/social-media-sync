/**
 * @typedef {("ENABLED" | "REMOVED" | "PAUSED" | "DELETED")} FacebookStatus
 * @typedef {("ADSET_PAUSED" |
 *  "CAMPAIGN_PAUSED" |
 *  "DISAPPROVED" |
 *  "PENDING_BILLING_INFO" |
 *  "PENDING_REVIEW" |
 *  "PREAPPROVED" |
 *  "WITH_ISSUE"
 * )} FacebookEffectiveStatus
 * @typedef {("ENABLED" | "REMOVED" | "PAUSED")} GoogleStatus
 */

const AD_GLOB_STATUSES = {
    ACTIVE: "active",
    ARCHIVED: "archived",
    PAUSED: "paused",
    CAMPAIGN: {
        ARCHIVED: "campaign_archived",
        PAUSED: "campaign_paused",
    },
    ADGROUP: {
        ARCHIVED: "adset_archived",
        PAUSED: "adset_paused",
    },
    PROCESSING: {
        PENDING: "pending",
        PENDING_BILLING: "pending_billing_info",
        PENDING_REVIEW: "pending_review",
        ERROR: "error",
        ENDED: "ended",
        UNKNOWN: "pending",
        DISAPPROVED: "disapproved",
    },
};

const googleDictionary = {
    policy: {
        // Review
        REVIEW_IN_PROGRESS: AD_GLOB_STATUSES.PROCESSING.PENDING_REVIEW,
        REVIEWED: "",
        UNDER_APPEAL: "",
        ELIGIBLE_MAY_SERVE: "",
        UNKNOWN: "",
        UNSPECIFIED: "",

        // Approval
        DISAPPROVED: AD_GLOB_STATUSES.PROCESSING.DISAPPROVED,
        APPROVED_LIMITED: "",
        APPROVED: "",
        AREA_OF_INTEREST_ONLY: "",
    },
    processing: {
        SERVING: AD_GLOB_STATUSES.ACTIVE,
        ENDED: AD_GLOB_STATUSES.PROCESSING.ENDED,
        PENDING: AD_GLOB_STATUSES.ACTIVE, // Exception !!!
        SUSPENDED: AD_GLOB_STATUSES.PROCESSING.ERROR,
        UNKNOWN: AD_GLOB_STATUSES.PROCESSING.UNKNOWN,
    },
    campaign: {
        ENABLED: AD_GLOB_STATUSES.ACTIVE,
        REMOVED: AD_GLOB_STATUSES.CAMPAIGN.ARCHIVED,
        PAUSED: AD_GLOB_STATUSES.CAMPAIGN.PAUSED,
    },
    adGroup: {
        ENABLED: AD_GLOB_STATUSES.ACTIVE,
        REMOVED: AD_GLOB_STATUSES.ADGROUP.ARCHIVED,
        PAUSED: AD_GLOB_STATUSES.ADGROUP.PAUSED,
    },
    ad: {
        ENABLED: AD_GLOB_STATUSES.ACTIVE,
        REMOVED: AD_GLOB_STATUSES.ARCHIVED,
        PAUSED: AD_GLOB_STATUSES.PAUSED,
    },
};

const facebookDictionary = {
    ACTIVE: AD_GLOB_STATUSES.ACTIVE,
    IN_PROCESS: AD_GLOB_STATUSES.PROCESSING.PENDING_REVIEW,
    ADSET_PAUSED: AD_GLOB_STATUSES.ADGROUP.PAUSED,
    CAMPAIGN_PAUSED: AD_GLOB_STATUSES.CAMPAIGN.PAUSED,
    DISAPPROVED: AD_GLOB_STATUSES.PROCESSING.DISAPPROVED,
    PENDING_BILLING_INFO: AD_GLOB_STATUSES.PROCESSING.PENDING_BILLING,
    PENDING_REVIEW: AD_GLOB_STATUSES.PROCESSING.PENDING_REVIEW,
    PREAPPROVED: AD_GLOB_STATUSES.ACTIVE,
    WITH_ISSUES: AD_GLOB_STATUSES.PROCESSING.ERROR,
    PAUSED: AD_GLOB_STATUSES.PAUSED,
    ARCHIVED: AD_GLOB_STATUSES.ARCHIVED,
    DELETED: AD_GLOB_STATUSES.ARCHIVED,
};

/**
 * Detect google ad effective status depending from campaign, adgroup and ad statuses
 * when ad's status is not equal to "ENABLED" we must take that status as effective status,
 * In other case we need see adGroup status and campaign status
 *
 * WHEN one of campaign-adgroup-ad don't equals to "ENABLED" we need take process Status
 * PROCESS STATUS - status when the campaign have some processing work or completed (ended)
 *
 * @param {{
 *  adStatus: GoogleStatus
 *  adGroupStatus: GoogleStatus
 *  campaignStatus: GoogleStatus
 *  campaignProcessingStatus: GoogleStatus
 * }} param0
 * @returns
 */
module.exports.detectGoogle = function ({
    adStatus,
    adGroupStatus,
    campaignStatus,
    policyStatuses,
    campaignProcessingStatus,
}) {
    let effectiveStatus = "";

    const { reviewStatus, approvalStatus } = policyStatuses;
    console.log({ reviewStatus, approvalStatus });
    // REVIEW PROCESSING
    if (reviewStatus || approvalStatus) {
        if (approvalStatus === "UNKNOWN") {
            effectiveStatus = googleDictionary["policy"][reviewStatus];
        } else if (approvalStatus && approvalStatus === "DISAPPROVED") {
            effectiveStatus = googleDictionary["policy"][approvalStatus];
        }
    }

    // WHEN REVIEW IS APPROVED
    if (effectiveStatus.length === 0) {
        if (adStatus !== "ENABLED" || campaignStatus !== "ENABLED" || adGroupStatus !== "ENABLED") {
            if (adStatus !== "ENABLED") {
                effectiveStatus = googleDictionary["ad"][adStatus];
            } else if (adGroupStatus !== "ENABLED") {
                effectiveStatus = googleDictionary["adGroup"][adGroupStatus];
            } else {
                effectiveStatus = googleDictionary["campaign"][campaignStatus];
            }
        } else if (
            adStatus == "UNKNOWN" ||
            campaignStatus == "UNKNOWN" ||
            adGroupStatus == "UNKNOWN"
        ) {
            effectiveStatus = googleDictionary["processing"].UNKNOWN;
        } else if (Object.keys(googleDictionary["processing"]).includes(campaignProcessingStatus)) {
            effectiveStatus = googleDictionary["processing"][campaignProcessingStatus];
        }
    }

    return { effectiveStatus: effectiveStatus, status: googleDictionary["ad"][adStatus] };
};

/**
 * Will return the effective status which we will use locally
 *
 * @param { FacebookStatus | FacebookEffectiveStatus} effectiveStatus
 * @param { FacebookStatus } status
 * @returns {{
 *  effectiveStatus: string,
 *  status: string
 * }}
 */
module.exports.detectFacebook = function (effectiveStatus, status) {
    return {
        effectiveStatus: facebookDictionary[effectiveStatus],
        status: facebookDictionary[status],
    };
};
