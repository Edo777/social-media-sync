const list = {
   "STATUS_SYNC_FB" : 111,
   "STATUS_SYNC_GLE": 222,
   "CLEAR_API_CALLS": 333
};

/**
 * Take code of action
 * @param {"STATUS_SYNC_FB" | "STATUS_SYNC_GLE" | "CLEAR_API_CALLS" } action
 * @returns
 */
function getCode(action) {
    return list[action];
}

module.exports = { getCode };
