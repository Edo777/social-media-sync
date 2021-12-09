const list = {
   "STATUS_SYNC" : 111,
};

/**
 * Take code of action
 * @param {{}} action
 * @returns
 */
function getCode(action) {
    return list[action];
}

module.exports = { getCode };
