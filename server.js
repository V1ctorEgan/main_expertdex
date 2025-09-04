const express = require('express');
require('dotenv').config();
const app = express();
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const Credential = require("./middleware/credentials")
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const http = require('http');
const { Server } = require("socket.io");
const server = http.createServer(app);
const PORT = process.env.PORT || 3501;

// Initialize Socket.IO and attach it to the HTTP server
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL, // Allow connections from your frontend
        methods: ["GET", "POST"]
    }
});


// Connect to MongoDB
connectDB();

// custom middleware logger
app.use(logger);

// fetch cookies requirement
app.use(Credential)

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json 
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

//serve static files
app.use('/', express.static(path.join(__dirname, '/public')));

// routes

app.use('/', require('./routes/root'));
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));
app.use(verifyJWT)

app.use('/company', require('./routes/api/company'));
app.use('/accounts', require('./routes/api/accounts'));
app.use('/vehicle', require('./routes/api/vehicle'));
app.use('/driver', require('./routes/api/driver'))
console.log('here')

app.use('/bookings', require('./routes/api/booking')(io));
app.use('/payments', require('./routes/api/payment'));
app.use((req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.send('<h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p>');
    } else if (req.accepts('json')) {
        res.json({ "error": "404 Not Found" });
    } else {
        res.type('txt').send("404 Not Found");
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Listen for a 'disconnect' event
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
app.use(errorHandler);

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});