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

    let outputTranscription = function(data) {
        process.stdout.write(
            (data.results[0] && data.results[0].alternatives[0])
                ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
                : `\n\nReached transcription time limit, press Ctrl+C\n`);
        this.emit('text-send', data);

        // if end of utterance, let's restart stream
        // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
        if (data.results[0] && data.results[0].isFinal) {
            // End the stream
            speechClient.endStream();
            // Start it again
            speechClient.initializeGoogleRequest(
                (error) => { console.error(error); },
                (data) => outputTranscription(data) );
            // startRecognitionStream(client);
            // console.log('restarted stream serverside');
        }
    }

    outputTranscription = outputTranscription.bind(client)


    client.on('join', (data) => {
        // Send a message to the socket that it completed the handhsake
        client.emit('messages', 'Socket connected to server.');
    });

    client.on('messages', (data) => {
        // On receiving a message, emit it the broad channel 
        client.emit('broad', data);
    });

    client.on('start-stream', (d) => {
        speechClient.initializeGoogleRequest(
            (error) => { console.error(error); }, 
            (data) => outputTranscription(data));
    });

    client.on('audio-change', (audioData) => {
        speechClient.sendAudio(audioData);
    });

    client.on('end-stream', () => speechClient.endStream())
})

app.get('/', (req, res) => res.sendStatus(200));

// Listen to our port
server.listen(port, () => {
    console.log(`Listening to requests on port ${port}`);
});




