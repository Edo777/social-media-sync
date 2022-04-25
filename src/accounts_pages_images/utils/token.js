const { Companies } = require("../shared/database/models");
const { newError } = require("../shared/utils");
const jwt = require("jsonwebtoken");
const secret = `mysecrettokenforcompany`;

const crypto = require("crypto");

/**
 * Verify token
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
async function verifyToken(req, res, next) {
    try {
        // check header token
        const token = req.headers["x-auth-token"];

        if (!token) {
            newError("JsonWebTokenError", "required");
        }

        // // check session token
        // if (process.isProd()) {
        //     const sessionToken = req.session.token;
        //     if (!sessionToken) {
        //         newError("JsonWebTokenError", "session ended login again");
        //     }

        //     if (token !== sessionToken) {
        //         newError("UnauthorizedError", "Access denied");
        //     }
        // }

        // verify token
        const decoded = jwt.verify(token, secret);

        if (!decoded.company.ip || !decoded.company.userAgent) {
            newError("JsonWebTokenError", "broken token");
        }

        // // verify same user
        // if (
        //     decoded.user.ip !== hash(req.ip.toString()) ||
        //     decoded.user.userAgent !== hash(req.headers["user-agent"].toString())
        // ) {
        //     newError("JsonWebTokenError", "wrong token");
        // }

        const sendLoagout = function (message) {
            return res.status(401).send({
                status: "logout",
                message: message,
            });
        };

        if (
            !decoded ||
            !decoded.company ||
            !decoded.company.id
            // !decoded.company.routine ||
            // !decoded.company.routine.id
        ) {
            return sendLoagout("invalid");
        }

        const company = await Companies.findOne({
            attributes: ["id"],
            where: {
                id: decoded.company.id,
            },
        });

        if (!company) {
            return sendLoagout("no_company");
        }

        const diff = Date.now() - decoded._timestamp;
        const expires = decoded._expiresMs;

        if (diff > expires) {
            return sendLoagout("expired");
        }

        req.identity = decoded;
        return next();
    } catch (error) {
        error.name = error.name || "JsonWebTokenError";
        next(error);
    }
}

/**
 * Generate jwt token for requests
 * @param {*} companyData 
 * @param {*} expires 
 * @returns 
 */
async function generateToken(companyData, expires = null) {
    try {
        const maxExpires = 3600 * 24; // 24 hour
        const expiresIn = expires || maxExpires;

        return jwt.sign(
            {
                _expiresMs: expiresIn * 1000,
                _timestamp: Date.now(),
                company: companyData,
            },
            secret,
            {
                algorithm: "HS512",
                expiresIn: expiresIn,
            }
        );
    } catch (e) {
        console.log(e, `${__filename}:74`);
        throw e;
    }
}

/**
 * Generate refresh token
 * @param {any} dataToHash 
 * @returns 
 */
function generateRefreshToken(dataToHash) {
    const dateNow = Date.now();
    dataToHash = `${dataToHash}-${dateNow}`;
    return crypto.createHash("sha256").update(dataToHash).digest("hex");
}

/**
 * Generate random string by length
 * @param {number} len 
 * @param {string} format 
 * @returns 
 */
function generateRandomString(len, format="hex") {
    return crypto.randomBytes(len || 1).toString(format);    
}

/**
 * Hash given text
 * @param {string} plain 
 * @param {string} algorithm 
 * @returns 
 */
function hash(plain, algorithm = "sha256") {
    return crypto.createHash(algorithm).update(plain.toString()).digest("hex");
};


module.exports = {
    hash,
    verifyToken,
    generateToken,
    generateRefreshToken,
    generateRandomString
};
