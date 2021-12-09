const BaseModel = require("../lib/BaseModel");

/**
 * Campaign constructor.
 */
const Campaign = function () {};
Campaign.fields = {
    id: "campaign_id",
    name: "campaign_name",
    advertiserId: "advertiser_id",
    budget: "budget",
    budgetMode: "budget_mode",
    optStatus: "opt_status",
    objectiveType: "objective_type",
    budgetOptimizeSwitch: "budget_optimize_switch",
    bidType: "bid_type",
    optimizeGoal: "optimize_goal",
};

Campaign.BudgetMode = {
    BUDGET_MODE_INFINITE: "BUDGET_MODE_INFINITE",
    BUDGET_MODE_DAY: "BUDGET_MODE_DAY",
    BUDGET_MODE_TOTAL: "BUDGET_MODE_TOTAL",
};

Campaign.ObjectiveType = {
    APP_INSTALL: "APP_INSTALL",
    CONVERSIONS: "CONVERSIONS",
    TRAFFIC: "TRAFFIC",
    VIDEO_VIEWS: "VIDEO_VIEWS",
    REACH: "REACH",
    LEAD_GENERATION: "LEAD_GENERATION",
};

Campaign.BidType = {
    BID_TYPE_CUSTOM: "BID_TYPE_CUSTOM",
    BID_TYPE_MAX_CONVERSION: "BID_TYPE_MAX_CONVERSION",
};

module.exports = BaseModel.extendTo(Campaign);
