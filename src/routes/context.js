import express from 'express';
import ContextService from '../services/ContextService';

const router = express.Router();

/**
 * Get the context from the JSON file we have stored in memory
 */
router.get('/',  async (req, res) => {
    try {
        res.status(200).json(req.app.locals.context);
    } catch (e) {
        res.status(500).send(e.message)
    }
});

/**
 * Update our context object within memory.
 */
router.put('/', async (req, res) => {
    try {
        // Get our phrases from the incoming context object
        const { phrases } = req.body;
        // Get our in memory context and speech client
        const { context, speechClient, restartStream } = req.app.locals;
        // console.log(context);
        console.log(req.body)

        // Add to our existing context object's phrases
        context.phrases.push(...phrases);
        let phraseSet = new Set(context.phrases);
        context.phrases = Array.from(phraseSet);

        // Let the Google Service know this context has been updated
        speechClient.updateContext(context);
        // Alert the socket to restart the service
        restartStream();

        // Write to the file
        await ContextService.writeContext(context);

        res.status(200).send(context);
    } catch (e) {
        res.status(500).send(e.message)
    }
})

router.delete('/', async (req, res) => {
    try {
        const { index } = req.body;
        // Get the context object from memory
        const { context, speechClient, restartStream } = req.app.locals;
        const { phrases } = context;
        
        // Get the phrases and delete the index
        if (index > 0 || index >= phrases.length) {
            res.status(400).send('Index provided was out of bounds.')
        }

        phrases.splice(index, 1)
        context.phrases = phrases;

        // Let the Google Service know this context has been updated
        speechClient.updateContext(context);
        restartStream();

        // Write to the file
        await ContextService.writeContext(context);

        res.status(200).send(context);
    } catch (e) {
        res.status(500).send(e.message);
    }
})

export default router;
