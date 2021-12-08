const list = {
   
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
