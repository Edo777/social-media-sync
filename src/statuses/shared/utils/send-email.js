const nodemailer = require("nodemailer");

/**
 * Create email transporter.
 * @param {String} emailUser
 * @returns {any}
 */
function createTransporter(emailUser) {
    return nodemailer.createTransport({
        host: process.env[`SMTP_${emailUser}_HOSTNAME`],
        port: process.env[`SMTP_${emailUser}_PORT`],
        secure: false,
        auth: {
            user: process.env[`SMTP_${emailUser}_USERNAME`],
            pass: process.env[`SMTP_${emailUser}_PASSWORD`],
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
}

const transporterNoReplay = createTransporter("NOREPLAY");
const transporterSupport = createTransporter("SUPPORT");
const transporterInfo = createTransporter("INFO");

/**
 * Mailoptions must have that structure
 * - to: 'myfriend@yahoo.com',
 * - subject: 'Sending Email using Node.js',
 * - text: 'That was easy!'
 * @param transporter
 * @param mailOptions
 * @returns {Promise<Array>}
 */
function sendMail(
    transporter,
    mailOptions,
    from = `No-Reply AdRoot Ad Manager <no-reply@adroot.io>`
) {
    mailOptions.from = from;

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error, `${__filename}:42`);
            } else {
                return resolve(true);
            }
        });
    });
}

function sendNoReplay(mailOptions) {
    return sendMail(transporterNoReplay, mailOptions);
}

function sendSupport(mailOptions) {
    return sendMail(transporterSupport, mailOptions);
}

function sendInfo(mailOptions) {
    return sendMail(transporterInfo, mailOptions);
}

module.exports = {
    sendNoReplay: sendNoReplay,
    sendSupport: sendSupport,
    sendInfo: sendInfo,
};
