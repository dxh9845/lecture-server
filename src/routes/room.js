import express from 'express';
import fs from 'fs';
import util from 'util';
const router = express.Router();

/**
 * Create the room ID and specify that the client is joined
 */
router.get('/create', (req, res) => {
    // Get the socket defined from oir middleware
    const { io } = req.app.locals; 
    const { roomId } = req.query;

    if (!roomId) {
        res.status(400).send('Missing query parameter roomId.')
    }

    // Create and join the room
    io.room = roomId;
    io.join(roomId);

    console.log(`Created the room ${client}`);
    

    let roomLink = `${req.hostname}/room/join/${joinId}`;

    res
        .status(200)
        .send({ 
            message: `Created a new lecture recording at ${roomLink}.`,
            roomLink: roomLink
        });    
})

/**
 * Join the room.
 */
router.get('/join/:roomId', (req, res) => { 
    // Get the room id from the request
    const { roomId } = req.params;
    const { io } = req.app.locals; 
    io.join(roomId);
    console.log(`Participant at ${req.ip} joined room ${roomId}`);
    res.status(200).send();
});

export default router;