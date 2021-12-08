"use strict";
/**
 * Get by spec condition
 * @param {SequelizeModel} model
 * @param {object} condition
 * @param {{attributes, include}} options
 * @returns
 */
async function _get(model, condition, options = null) {
    const findOptions = { where: condition };

    // attributes
    if (options && options["attributes"]) {
        findOptions["attributes"] = options["attributes"];
    }

    // includes
    if (options && options.include) {
        findOptions.include = options.include;
    }

    return await model.findOne(findOptions);
}

/**
 * Get many
 * @param {SequelizeModel} model
 * @param {object} condition
 * @param {{attributes, include}} options
 * @returns
 */
async function _getMany(model, condition, options) {
    const findOptions = { where: condition };

    // attributes
    if (options && options["attributes"]) {
        findOptions["attributes"] = options["attributes"];
    }

    // includes
    if (options && options.include) {
        findOptions.include = options.include;
    }

    return await model.findAll(findOptions);
}

async function updateAdsDependingStatus({adId, adsetId, cre}) {

}

// {
//     "object": "ad_account",
//     "entry": [
//       {
//         "id": "0",
//         "time": 1638864942,
//         "changes": [
//           {
//             "field": "in_process_ad_objects",
//             "value": {
//               "id": "111111111111",
//               "level": "CREATIVE",
//               "status_name": "Paused"
//             }
//           }
//         ]
//       }
//     ]
//   }
async function processData(data) {
    console.log("Dao");
}

module.exports = {
    processData
};
