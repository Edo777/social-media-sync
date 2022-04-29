const list = {
   "FB_ACCOUNTS_IMAGES_LOAD" : 111,
   "FB_ACCOUNTS_INFO_LOAD" : 112
};

/**
 * Take code of action
 * @param {"FB_ACCOUNTS_IMAGES_LOAD"} action
 * @returns
 */
function getCode(action) {
    return list[action];
}

module.exports = { getCode };
