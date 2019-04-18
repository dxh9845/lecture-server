import { MESSAGES, JOIN, BROAD, START_STREAM, AUDIO_DATA, END_STREAM, TEXT_SEND, GET_NLP, TOPIC_SEND } from '../utils/message.types';

/**
 * Configures the Socket.io instance.
 * @param {GoogleSpeechAPI} speechClient - The Google Speech API wrapper instance.
 * @param {GoogleNLPAPI} nlpClient - The Google NLP API wrapper
 */
export default function socketSetup( speechClient, nlpClient ) {


    return function (client) {
        console.log(`Client connected to server.`);
        
        // Send a message to the new socket that it completes the handshake
        client.on(JOIN, (d) => { client.emit(MESSAGES, 'Socket connected to the server') });

        // When we receive a message, emit it to anyone who wants it 
        client.on(MESSAGES, (data) => { client.emit(BROAD, data) });

        // On starting an audio recognition stream, we need to initialize our request
        client.on(START_STREAM, (roomId) => {
            console.log("HIT");
            speechClient.startRecognizeStream( (data) => client.to(roomId).emit(TEXT_SEND, data) );
        });

        client.on(END_STREAM, (d) => { speechClient.endStream(); });

        client.on(AUDIO_DATA, (ad) => { speechClient.sendAudio(ad) });

        client.on(GET_NLP, () => { 
            nlpClient.getSalience(speechClient.lastTranscript)
                .then((topic) => {
                    if (topic) {
                        client.emit(TOPIC_SEND, topic);
                    } else {
                        client.emit(TOPIC_SEND, '')
                    }
                })
        
        })
    }

}