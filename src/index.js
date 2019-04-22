import express from 'express';
// import { EventEmitter } from 'events';
import { Server } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import SocketServer from 'socket.io';
import GoogleSpeechWrapper from './services/GoogleSpeech';
import GoogleNLPWrapper from './services/GoogleNLP';
import randomstring from 'randomstring';

// Middleware
// import ContextMiddleware from './middleware/ContextMiddleware'; 


// import ContextService from './services/ContextService';

// Routes
import ContextRouter from './routes/context.js';

// Configuration setup
const port = (process.env.PORT || 8081)
import dotenv from 'dotenv';
dotenv.config();
// import { createTerminus } from '@godaddy/terminus';

// Sockets messages
import { CONNECTION, MESSAGES, JOIN, BROAD, START_STREAM, AUDIO_DATA, END_STREAM, TEXT_SEND, GET_NLP, TOPIC_SEND, NEW_LECTURE, ROOM_ID, JOIN_LECTURE, END_LECTURE, SEND_CONTEXT } from './utils/message.types';
    
// Set up the server
const app = express();

/*******************************************************
 *                     SOCKET SETUP                    *
 ******************************************************/
const server = Server(app);
const io = SocketServer(server);

// Track rooms
let rooms = new Set();

// Create a custom event bus for server side conmmunication
// const serverEmitter = new EventEmitter();

io.on(CONNECTION, (socket) => {
    console.log('Client connected to server.');

    socket.nlpClient = new GoogleNLPWrapper();

    // Send a message to the teacher that it completes the handshake
    socket.on(JOIN, (d) => { socket.emit(MESSAGES, 'Client has connected ') });

    socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          socket.connect();
        } else if (reason === 'transport close' && socket.room) {
            onEndLecture();
        }
      });

    // When we receive a message, emit it to anyone who wants it 
    socket.on(MESSAGES, (data) => { socket.emit(BROAD, data) });

    // On starting an audio recognition stream, we need to initialize our request
    const onStartStream = () => {
        if (socket.room) {
            socket.speechClient.startRecognizeStream((data) => io.in(socket.room).emit(TEXT_SEND, data));
        }
    }

    // Listen for start stream events from clients
    socket.on(START_STREAM, onStartStream);

    socket.on(END_STREAM, (d) => { socket.speechClient.endStream(); });

    // Listen for audio data when a teacher speaks
    socket.on(AUDIO_DATA, (ad) => socket.speechClient.sendAudio(ad) );

    // On creating a lecture, create a socket room 
    const onNewLecture = () => {
        let lectureRoom = '';
        do {
            lectureRoom = randomstring.generate({
                length: 5,
                charset: 'alphabet',
                capitalization: 'uppercase',
            });
        } while (lectureRoom in rooms);
        socket.emit(ROOM_ID, lectureRoom);
        socket.room = lectureRoom;
        socket.join(lectureRoom);
        rooms.add(lectureRoom)
        socket.speechClient = new GoogleSpeechWrapper();
        console.log(`New room created: ${socket.room}`)
    }

    socket.on(NEW_LECTURE, onNewLecture);

    // Update the context
    const onUpdateContext = (contextObj) => {
        console.log(contextObj)
        socket.speechClient.updateContext(contextObj);
        console.log(socket.speechClient.config)
        if (socket.speechClient.recognizeStream) {
            onStartStream();
        }
    }
    socket.on(SEND_CONTEXT, onUpdateContext);

    // When a student joins a lecture, add them to the socket room
    const onJoinLecture = (lectureRoom) => {
        socket.join(lectureRoom);
        console.log(`Room joined: ${lectureRoom}`)
    }

    socket.on(JOIN_LECTURE, onJoinLecture);

    // When teacher ends a lecture, free up the room
    const onEndLecture = (lectureRoom) => {
        io.of('/').in(lectureRoom).clients((err, clients) => {
            if (clients.length > 0) {
                console.log(`Connected clients: ${clients.length}`);
                clients.forEach((socket_id) => {
                    io.sockets.sockets[socket_id].leave(lectureRoom);
                });
            }
            rooms.delete(lectureRoom);
        });
        socket.room = null;
        // console.log(io.sockets.clients(lectureRoom))
        // console.log(io.sockets.adapter.rooms[lectureRoom])
        // rooms.delete(roomId);
        // console.log(`Lecture at room ${roomId} ended.`);

    }

    socket.on(END_LECTURE, onEndLecture)

    socket.on(GET_NLP, (lastTranscript) => {
        console.log(lastTranscript)
        socket.nlpClient.getSalience(lastTranscript)
            .then((topic) => {
                if (topic) {
                    socket.emit(TOPIC_SEND, topic);
                } else {
                    socket.emit(TOPIC_SEND, '')
                }
            })
    });

    
});

/******************************************************* 
 *                       MIDDLEWARE                    *
 * ****************************************************/
app.use(bodyParser.json());
app.use(cors());
// Add our speech client and context object to our web requests
// app.use(ContextMiddleware());

/*******************************************************
 *                        ROUTING                      *
 ******************************************************/
app.get('/', (req, res) => {
    res.status(200).send();
});

// app.use('/context', ContextRouter);


/*******************************************************
 *              IN-MEMORY CONTEXT                      *
 ******************************************************/
// createTerminus(server, {
//     // signal: 'SIGINT',
//     signals: ['SIGINT', 'SIGKILL', 'SIGTERM'],
//     // On server shutdown, write back to our context
//     onSignal: () => ContextService.writeContext(app.locals.context),
// });



// Listen to our port
server.listen(port, () => {
    console.log(`Listening to requests on port ${port}`);
});




