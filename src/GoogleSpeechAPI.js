"use strict";

import speech from '@google-cloud/speech';
const bSpeech = speech.v1p1beta1;

export default class GoogleSpeechAPI {
    client;

    request;

    recognizeStream;

    constructor() {
        this.client = new bSpeech.SpeechClient({
            credentials: {
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_CLIENT_EMAIL
          }});
        this.request = {
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
                enableAutomaticPunctuation: true,
                speechContexts: [{
                    phrases: []
                }]
            },
            interimResults: true,
            metadata: {
                interactionType: "PRESENTATION",
            },
        }

        this.initializeGoogleRequest = this.initializeGoogleRequest.bind(this);
        this.sendAudio = this.sendAudio.bind(this);
        this.endStream = this.endStream.bind(this);
    }

    /**
     * Create the streamingRecognize object and specify what to do 
     */
    initializeGoogleRequest(onError, onData) {
        console.log(this.request)
        this.recognizeStream = this.client.streamingRecognize(this.request)
            .on('error', onError)
            .on('data', onData); 

    }

    endStream() {
        if (this.recognizeStream) {
            this.recognizeStream.end();
        }
        this.recognizeStream = null;
    }

    sendAudio(audioData) {
        if (this.recognizeStream) {
            this.recognizeStream.write(audioData);
        }
    }


}


