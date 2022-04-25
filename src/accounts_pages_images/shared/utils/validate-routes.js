module.exports = async (_value, _schema, next, consoleError = false) => {
    let { error } = _schema.validate(_value, { abortEarly: false });

    if (error) {
        if (consoleError) {
            console.log(error, "------------------------------", `${__filename}:6`);
        }
        const _error = new Error();
        error = error.details.map((err) => {
            if (process.isProd()) {
                return "required_field_missing";
            }

            return `${err.path[0]}_validation_error`;
        });

        _error.name = "MyValidationError";
        _error.errors = error;
        next(_error);
    }

    return true;
};
