import express from 'express';
import { Server } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import SocketServer from 'socket.io';

// Middleware
import GoogleMiddleware from './middleware/GoogleMiddleware'; 
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
import SocketSetup from './services/SocketSetup';


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

// Make the initial connection to the socket
io.on(CONNECTION, SocketSetup(speechClient))

/******************************************************* 
 *                       MIDDLEWARE                    *
 * ****************************************************/
app.use(bodyParser.json());
app.use(cors());
// Add our speech client and context object to our web requests
app.use(GoogleMiddleware({ speechClient }));
app.use(SocketMiddleware({ io }))

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




