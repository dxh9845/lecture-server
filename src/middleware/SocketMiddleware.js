import { TEXT_SEND } from '../utils/message.types';


module.exports = function ({ io }) {
    return function(req, res, next) {
        // Do we have our socket client defined? 
        if (!req.app.locals.io) {
            console.log(`Setting up the socket instance within the middleware once`)
            req.app.locals.io = io;

            const { speechClient } = req.app.locals;

            // Define a helper function for restarting the stream
            req.app.locals.restartStream = () => { speechClient.startRecognizeStream((data) => io.emit(TEXT_SEND, data)) };

        }

        // Use the next middleware function
        next();
    }
}