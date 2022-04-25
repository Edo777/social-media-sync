/**
 * Sleep by minutes
 * @param {number} minutes 
 * @returns 
 */
module.exports = function sleep(minutes) {
    return new Promise((resolve) => { setTimeout(() => resolve(true), minutes)});
}