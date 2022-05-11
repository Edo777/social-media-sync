const list = {
   "FB_ACCOUNTS_IMAGES_LOAD" : 111,
   "FB_ACCOUNTS_INFO_LOAD" : 112,
   "FB_PAGES_IMAGES_LOAD" : 113,
   "FB_PAGES_INFO_LOAD" : 114,
};

/**
 * Take code of action
 * @param {
 *  "FB_ACCOUNTS_IMAGES_LOAD" | 
 *  "FB_ACCOUNTS_INFO_LOAD" | 
 *  "FB_PAGES_INFO_LOAD" | 
 *  "FB_PAGES_IMAGES_LOAD"
 * } action
 * @returns
 */
function getCode(action) {
    return list[action];
}

module.exports = { getCode };
