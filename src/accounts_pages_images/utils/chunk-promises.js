/**
 * Execute promises with chunks
 * @param {[Promise]} promises 
 * @param {number} chunk 
 * @param {boolean} returnResult 
 * @returns 
 */
 async function executePromisesWithChunks(promises, chunk, returnResult = false) {
  const promiseChunks = _.chunk(promises, chunk);
  const result = null;

  for(const promiseChunk of promiseChunks) {
      const promiseResult = await Promise.allSettled(promiseChunk);

      if(returnResult) {
          if(result === null) {
              result = [];
          }

          result.push(...promiseResult);
      }
  }
  
  return result;
}

module.exports = executePromisesWithChunks;