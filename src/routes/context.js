import express from 'express';
import fs from 'fs';
import util from 'util';
const router = express.Router();
const promisify = util.promisify;

const awaitRead = promisify(fs.readFile);
const awaitWrite = promisify(fs.writeFile);

/**
 * Get the context from the JSON file we have stored.
 */
router.get('/',  async (req, res) => {
    try {
        // Read the context json file
        const str = await awaitRead('./src/context.json', "utf8");
        const contextObj = JSON.parse(str);
        res.status(200).json(contextObj);
    } catch (e) {
        res.status(500).send(e.message)
    }
});

/**
 * Put updated context into the JSON file.
 */
router.put('/', async (req, res) => {
    try {
        // Get our phrases from the incoming context object
        const { phrases } = req.body;
        // Read our JSON file and turn it into an object
        const str = await awaitRead('./src/context.json', "utf8");
        let contextObj = JSON.parse(str);

        // Add to our existing context object's phrases
        contextObj.phrases.push(...phrases);
        let phraseSet = new Set(contextObj.phrases);
        contextObj.phrases = Array.from(phraseSet)
        
        // Write back to a file
        await awaitWrite('./src/context.json', JSON.stringify(contextObj, null, "\t"));

        res.status(200).send(contextObj);
    } catch (e) {
        res.status(500).send(e.message)
    }
})

export default router;
