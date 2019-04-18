import fs from 'fs';
import util from 'util';
const promisify = util.promisify;
const awaitRead = promisify(fs.readFile);
const awaitWrite = promisify(fs.writeFile);

export default {
    /**
     * Get our context from the JSON file and return it.
     */
    async getContextFromFile() {
        const strResult = await awaitRead(process.env.CONTEXT_PATH, 'utf8');
        return JSON.parse(strResult);
    },

    /**
     * Write the context object back to the file system. 
     * Ideally should happen only once, on end of server.
     * @param {Object} contextObject - The context object to write to the file system
     */
    async writeContext(contextObject) {
        // console.log(`Writing our context object back to file at server shutdown`);
        // Write back to a file
        await awaitWrite(process.env.CONTEXT_PATH, JSON.stringify(contextObject, null, "\t"));
    }
}