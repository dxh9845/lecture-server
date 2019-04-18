import ContextService from '../services/ContextService';

module.exports = function({ speechClient, nlpClient }) {  

    return async function(req, res, next) {
        // Check if the Google Speech Client is configured 
        if (!req.app.locals.speechClient) {
            console.log(`Defining our speech wrapper once`);
            // Add our speech client to the app
            req.app.locals.speechClient = speechClient;
        }

        // Store our context object in memory 
        if (!req.app.locals.context) {
            try {
                console.log(`Reading our context object from JSON file`);
                // Read from a file and get our context object
                req.app.locals.context = await ContextService.getContextFromFile();
                
            } catch (error) {
                next(error);
            }
            
        }

        if (!req.app.locals.nlpClient) {
            console.log(`Defining our speech wrapper once`);
            // Add our speech client to the app
            req.app.locals.nlpClient = nlpClient;
        }

        // Use the next middleware function 
        next();
    }
}