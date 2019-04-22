"use strict";

import speech from '@google-cloud/speech';
const bSpeech = speech.v1p1beta1;

export default class GoogleSpeechAPI {
    client;

    request;

    recognizeStream;

    get lastTranscript() {
        return this._lastTranscript;
    }

    set lastTranscript(val) {
        this._lastTranscript = val;
    }

    constructor() {
        this.client = new bSpeech.SpeechClient({
            credentials: {
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_CLIENT_EMAIL
          }});
        this.config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
            speechContexts: [
                {
                    phrases: []
                }
            ]
        };

        this.request = {
            config: this.config,
            interimResults: true,
            metadata: {
                interactionType: "PRESENTATION",
            },
        }

        this._lastTranscript = '';

        this.startRecognizeStream = this.startRecognizeStream.bind(this);
        this.sendAudio = this.sendAudio.bind(this);
        this.endStream = this.endStream.bind(this);
        this.updateContext = this.updateContext.bind(this);
    }

    updateContext(context) {
        try {
            this.config.speechContexts[0] = context;
        } catch (e) {
            if (e instanceof ReferenceError) {
                console.error(`Failed to update the context. Error ${e.message}`);
            } else {
                console.error(e.message);
            }
        } 
    }

    /**
     * Create the streamingRecognize object, passing in 
     * a function that uses Socket.io 
     * 
     * @param clientCallback {Function} - The function that will send our data on our client instance.
     */
    startRecognizeStream(clientCallback) {
        this.recognizeStream = this.client.streamingRecognize(this.request)
            .on('error', e => { console.error(e) })
            .on('data', (data) => {
                // Call our client callback to send the data
                clientCallback(data);


                // Check if the data is final if it exists
                // Resets the stream 
                if (data.results[0] && data.results[0].isFinal) {
                    // Set our last transcript
                    this._lastTranscript = data.results[0].alternatives[0].transcript;
                    // End the stream
                    this.endStream();
                    // Start again with the same parameterss
                    this.startRecognizeStream(clientCallback);
                }
            }); 
    }

    endStream() {
        if (this.recognizeStream) {
            this.recognizeStream.end();
        }
        this.recognizeStream = null;
        this._lastTranscript = '';
    }

    sendAudio(audioData) {
        if (this.recognizeStream) {
            this.recognizeStream.write(audioData);
        }
    }

}


