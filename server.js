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
const PORT = process.env.PORT || 3501;


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
console.log("here we are 1")
app.use('/', require('./routes/root'));
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));
app.use(verifyJWT)
console.log("here we are")
app.use('/company', require('./routes/api/company'));
app.use('/accounts', require('./routes/api/accounts'));
app.use('/vehicle', require('./routes/api/vehicle'));
console.log('All routes loaded successfully! r');
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


console.log('here now.');
app.use(errorHandler);

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});