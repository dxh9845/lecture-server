import { MESSAGES, JOIN, BROAD, START_STREAM, AUDIO_DATA, END_STREAM, TEXT_SEND, GET_NLP, TOPIC_SEND, NEW_LECTURE, JOIN_LECTURE, UPDATE_CONTEXT } from '../utils/message.types';

import GoogleSpeechWrapper from './GoogleSpeech';
import GoogleNLPWrapper from './GoogleNLP';

/**
 * Setup socket events for teachers when they initially connect.
 * @param {EventEmitter} eventBus - the event bus for server side communication
 */
export function teacherSocketSetup(eventBus) {
    /** Return the callback for the on connect event */
    return function (socket) {
        console.log(`A new teacher has connected on this server.`)

        const speechClient = new GoogleSpeechWrapper();

        // Send a message to the teacher that it completes the handshake
        socket.on(JOIN, (d) => { socket.emit(MESSAGES, 'Teacher has connected ') });

        // When we receive a message, emit it to anyone who wants it 
        socket.on(MESSAGES, (data) => { socket.emit(BROAD, data) });

        // On starting an audio recognition stream, we need to initialize our request
        const onStartStream = () => {
            if (socket.room) {
                console.log(socket.room)
                speechClient.startRecognizeStream((data) => socket.to(socket.room).emit(TEXT_SEND, data));
            }
            else {
                console.error(`No room was specified. Must join a room before starting a stream`);
                // socket.emit();
            }
        }

        // Listen for start stream events from clients
        socket.on(START_STREAM, onStartStream);
        // Listen for restart events when a teacher updates the context
        eventBus.on(START_STREAM, onStartStream);

        socket.on(END_STREAM, (d) => { speechClient.endStream(); });

        // Listen for audio data when a teacher speaks
        socket.on(AUDIO_DATA, (ad) => speechClient.sendAudio(ad) );

        // On creating a lecture, create a socket room 
        const onNewLecture = (lectureRoom) => {
            socket.room = lectureRoom;
            socket.join(lectureRoom);
            console.log(`New room created: ${socket.room}`)
        }

        // Handle internal routing via the event bus
        eventBus.on(NEW_LECTURE, onNewLecture);

        // Update the context
        const onUpdateContext = (contextObj) => speechClient.updateContext(contextObj);
        eventBus.on(UPDATE_CONTEXT, onUpdateContext);
    }
}

/**
 * Setup socket events for students when they initially connect.
 * @param {EventEmitter} eventBus - the event bus for server side communication.
 */
export function studentSocketSetup(eventBus) {
    /** Return the callback for the on connect event */
    return function (socket) {

        console.log(`A new student has connected to this server.`)

        const nlpClient = new GoogleNLPWrapper();

        // Send a message to the teacher that it completes the handshake
        socket.on(JOIN, (d) => { socket.emit(MESSAGES, 'A student has connected ') });

        // When we receive a message, emit it to anyone who wants it 
        socket.on(MESSAGES, (data) => { socket.emit(BROAD, data) });

        // When a student joins a lecture, add them to the socket room
        const onJoinLecture = (lectureRoom) => {
            socket.join(lectureRoom);
            console.log(`Room joined: ${lectureRoom}`)
        }

        eventBus.on(JOIN_LECTURE, onJoinLecture);

        socket.on(GET_NLP, () => {
            nlpClient.getSalience(speechClient.lastTranscript)
                .then((topic) => {
                    if (topic) {
                        socket.emit(TOPIC_SEND, topic);
                    } else {
                        socket.emit(TOPIC_SEND, '')
                    }
                })
        });
        
    }
}
