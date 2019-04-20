import ContextService from '../services/ContextService';

module.exports = function() {  

    return async function(req, res, next) {

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

        // Use the next middleware function 
        next();
    }
}