const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname)));

// Route for root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"login.html"));
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log("New user connected");

    socket.on("chat message", (message) => {
        // Broadcast the message to all connected clients
        io.emit("message", message);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

