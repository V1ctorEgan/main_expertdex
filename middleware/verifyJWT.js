const jwt = require('jsonwebtoken');
require('dotenv').config()

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    // console.log(authHeader)
    const token = authHeader.split(' ')[1];
    // console.log(token)
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            console.log('here o')
            if (err) return res.sendStatus(403); //invalid token
            console.log("passed")
            req.user = decoded.UserInfo.email;
            req.accountType = decoded.UserInfo.accountType;
            req.userId = decoded.UserInfo.id
            next();
        }
    );
}

module.exports = verifyJWT