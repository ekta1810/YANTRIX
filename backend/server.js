require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");  // ✅ you forgot this
const socketIo = require("socket.io");

// const SECRET_KEY = "supersecretkey";

const app = express();
const server = http.createServer(app);  // ✅ create http server
const io = socketIo(server, {
  cors: {
    origin: "*",  // In production, restrict to your frontend URL
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://mdzaid822503:mdzaid82404@cluster0.o874ysk.mongodb.net/yantrix?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Load User model
const User = require("./models/User");

app.use(cors());
app.use(express.json());

// task
app.use("/api/tasks",require("./routes/task"))
app.use("/api/projects",require("./routes/project"))
app.use("/api/users",require("./routes/user"))

// API: Signup
app.post("/api/signup", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({ message: "User already exists or invalid data" });
  }
});

// API: Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id:user._id,email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("chat message", (message) => {
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ✅ Start the server using server.listen, not app.listen
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
