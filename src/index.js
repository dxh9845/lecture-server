import express from 'express';
import { EventEmitter } from 'events';
import { Server } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import SocketServer from 'socket.io';

// Middleware
import ContextMiddleware from './middleware/ContextMiddleware'; 
import SocketMiddleware from './middleware/SocketMiddleware'; 

import GoogleSpeechWrapper from './services/GoogleSpeech.js';
import GoogleNLP from './services/GoogleNLP';
import ContextService from './services/ContextService';

// Routes
import ContextRouter from './routes/context.js';
import RoomRouter from './routes/room.js';

// Configuration setup
import dotenv from 'dotenv';
dotenv.config();
import { createTerminus } from '@godaddy/terminus';

// Sockets
import { CONNECTION } from './utils/message.types';
import { teacherSocketSetup, studentSocketSetup } from './services/SocketSetup';


const port = (process.env.PORT || 8081)

const speechClient = new GoogleSpeechWrapper();
const nlpClient = new GoogleNLP();
    
// Set up the server
const app = express();

/*******************************************************
 *                     SOCKET SETUP                    *
 ******************************************************/
const server = Server(app);
const io = SocketServer(server);

// Create a custom event bus for server side conmmunication
const serverEmitter = new EventEmitter();

// Create teacher and student namespaces for separation of concerns
const teacherNamespace = io.of('/teacher');
const studentNamespace = io.of('/student');

// Prep teacher and student connections
teacherNamespace.on(CONNECTION, teacherSocketSetup(serverEmitter));
studentNamespace.on(CONNECTION, studentSocketSetup(serverEmitter));

/******************************************************* 
 *                       MIDDLEWARE                    *
 * ****************************************************/
app.use(bodyParser.json());
app.use(cors());
// Add our speech client and context object to our web requests
app.use(ContextMiddleware());
app.use(SocketMiddleware({ io, serverEmitter }))

/*******************************************************
 *                        ROUTING                      *
 ******************************************************/
app.get('/', (req, res) => {
    res.status(200).send();
});

app.use('/context', ContextRouter);
app.use('/room', RoomRouter);


/*******************************************************
 *              IN-MEMORY CONTEXT                      *
 ******************************************************/
createTerminus(server, {
    // signal: 'SIGINT',
    signals: ['SIGINT', 'SIGKILL', 'SIGTERM'],
    // On server shutdown, write back to our context
    onSignal: () => ContextService.writeContext(app.locals.context),
});



// Listen to our port
server.listen(port, () => {
    console.log(`Listening to requests on port ${port}`);
});




