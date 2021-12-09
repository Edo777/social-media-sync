const TiktokException = require("./TiktokException");

/**
 * BaseModel constructor.
 */
const BaseModel = function () {};

/**
 * Default fields.
 */
BaseModel.fields = {};

/**
 * From api data to model.
 * @param {Function} ElementType
 * @param {any} apiData
 */
BaseModel.toModelData = function (ElementType, apiData) {
    const { fields } = ElementType;
    const model = new ElementType();

    Object.keys(fields).forEach(function (key) {
        model[key] = apiData[fields[key]] || null;
    });

    return model;
};

/**
 * From model to api data.
 * @param {Function} ElementType
 * @param {BaseModel} model
 */
BaseModel.toApiData = function (ElementType, model) {
    const { fields } = ElementType;
    const apiData = {};

    Object.keys(fields).forEach(function (key) {
        apiData[fields[key]] = model[key];
    });

    return apiData;
};

/**
 * Create new model model.
 * @param {Function} ElementType
 * @param {any} apiData
 */
BaseModel.instance = function (ElementType, modelData) {
    const { fields } = ElementType;
    const model = new ElementType();

    Object.keys(fields).forEach(function (key) {
        model[key] = modelData[key] || null;
    });

    return model;
};

/**
 * Child model element type extends from BaseModel.
 * @param {Function} ElementType
 * @returns {Function}
 */
BaseModel.extendTo = function (ElementType) {
    if (!ElementType.fields) {
        const modelName = ElementType.prototype.constructor.name;
        throw new TiktokException(`${modelName} has no "fields" member.`);
    }

    Object.keys(BaseModel.prototype).forEach(function (key) {
        ElementType.prototype[key] = BaseModel.prototype[key];
    });

    const inherits = {
        toModelData: "toModelData",
        toApiData: "toApiData",
        instance: "instance",
    };

    Object.keys(inherits).forEach(function (memberKey) {
        const memberValue = inherits[memberKey];

        ElementType[memberKey] = function (data) {
            return BaseModel[memberValue](ElementType, data);
        };
    });

    return ElementType;
};

module.exports = BaseModel;
