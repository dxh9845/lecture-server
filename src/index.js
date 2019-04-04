import express from 'express';
import { Server } from 'http';
import SocketServer from 'socket.io';
import GoogleSpeech from './GoogleSpeechAPI';

import dotenv from 'dotenv';

dotenv.config();

// 
const speechClient = new GoogleSpeech();


const port = (process.env.PORT || 8081)

// Set up the server and the websocket 
const app = express();
const server = Server(app);
const io = SocketServer(server);

io.on('connection', (client) => {
    
    console.log('Client connected to server.');

    client.on('join', (data) => {
        // Send a message to the socket that it completed the handhsake
        client.emit('messages', 'Socket connected to server.');
    });

    client.on('messages', (data) => {
        // On receiving a message, emit it the broad channel 
        client.emit('broad', data);
    });

    client.on('start-stream', (d) => {
        console.log("STARTING STREAM ONCE")
        speechClient.initializeGoogleRequest((error) => { console.error(error); }, (data) => { console.log("AD"); console.log(data) });
    });

    client.on('audio-change', (audioData) => {
        speechClient.sendAudio(audioData);
        // console.log("AUDIO CHANGE")
        
    });

    client.on('end-stream', () => speechClient.endStream())
})

app.get('/', (req, res) => res.sendStatus(200));

// Listen to our port
server.listen(port, () => {
    console.log(`Listening to requests on port ${port}`);
});




