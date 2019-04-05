"use strict";

import speech from '@google-cloud/speech';

export default class GoogleSpeechAPI {
    client;

    request;

    recognizeStream;

    constructor() {
        this.client = new speech.SpeechClient();
        this.request = {
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US'
            },
            interimResults: true
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


