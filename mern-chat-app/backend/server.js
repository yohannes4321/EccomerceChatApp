require('dotenv').config(); // Ensure dotenv is configured at the top
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');
const colors = require('colors');

const app = express();

// Connect to the database
connectDB();

// Middleware to parse JSON data
app.use(express.json());

// Routes
app.use("/api/user", userRoutes);
const chatRoutes = require("./routes/chatRoutes");  // Ensure correct path
app.use("/api/chat", chatRoutes);  // Connect chat routes to /api/chat

app.use("/api/message", messageRoutes);





// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000; // Use default port if not specified
const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

// Set up Socket.io
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://chatapp-frontend-66ok.onrender.com",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
    // Add any cleanup logic here if necessary
  });
});
