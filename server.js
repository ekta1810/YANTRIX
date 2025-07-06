const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const socketIo = require("socket.io");
const cors = require("cors");

// You can also use dotenv to load this securely
const SECRET_KEY = "supersecretkey";

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/yantrix", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User model
const User = require("./models/User");

// Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, restrict this
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API: Signup
app.post("/api/signup", async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({ message: "User already exists or invalid data" });
  }
});

// API: Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API: Validate token
app.get("/api/validate", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ valid: true, decoded });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// Route to serve dashboard.html (token must be in query)
app.get("/dashboard", (req, res) => {
  const token = req.query.token;
  if (!token) return res.redirect("/");

  try {
    jwt.verify(token, SECRET_KEY);
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
  } catch {
    res.redirect("/");
  }
});

// Socket.IO authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error: No token"));

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    socket.user = payload; // attach user info to socket
    next();
  } catch {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log(`${socket.user.username} connected to WebSocket`);

  socket.on("chat message", (msg) => {
    const text = `${socket.user.username}: ${msg}`;
    io.emit("message", text);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.user.username} disconnected`);
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});