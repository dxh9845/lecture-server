import express from 'express';
import fs from 'fs';
import util from 'util';
import { format } from "url";
const router = express.Router();

/**
 * Create the room ID and specify that the client is joined
 */
router.get('/create', (req, res) => {
    // Get the socket defined from oir middleware
    const { io, createNewLecture } = req.app.locals; 
    const { roomId } = req.query;

    if (!roomId) {
        res.status(400).send({ error: 'Missing query parameter roomId.' })
    } else {
        // serverEmitter.emit('newLecture', roomId);

        createNewLecture(roomId);

        const baseURL = format({
            protocol: req.protocol,
            host: req.get('host'),
            // pathname: req.originalUrl
        });

        let roomLink = `${baseURL}/room/join?roomId=${roomId}`;

        res
            .status(200)
            .send({
                message: `Created a new lecture recording at ${roomLink}.`,
                roomLink: roomLink
            });    
    }
})

/**
 * Join the room.
 */
router.get('/join/:roomId', (req, res) => { 
    // Get the room id from the request
    const { roomId } = req.params;
    const { io, joinNewLecture } = req.app.locals; 

    // io.join(roomId);
    joinNewLecture(roomId);

    console.log(`Participant at ${req.ip} joined room ${roomId}`);
    res.status(200).send();
});

export default router;