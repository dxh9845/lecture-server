import { TEXT_SEND, START_STREAM, NEW_LECTURE, JOIN_LECTURE, UPDATE_CONTEXT } from '../utils/message.types';


module.exports = function ({ io, serverEmitter }) {
    return function(req, res, next) {
        // Do we have our socket client defined? 
        if (!req.app.locals.io) {
            console.log(`Setting up the socket instance within the middleware once`)
            req.app.locals.io = io;

            // Make a helper function for updating context
            req.app.locals.updateContext = () => serverEmitter.emit(UPDATE_CONTEXT);

            // A helper function to restart the recognition stream
            req.app.locals.restartStream = () => serverEmitter.emit(START_STREAM);

            // Make a helper function for creating a new lecture 
            req.app.locals.createNewLecture = (roomId) => { serverEmitter.emit(NEW_LECTURE, roomId); }

            // Make a helper function for joining a new lecture
            req.app.locals.joinNewLecture = (roomId) => serverEmitter.emit(JOIN_LECTURE, roomId);

        }
        
        // Use the next middleware function
        next();
    }
}