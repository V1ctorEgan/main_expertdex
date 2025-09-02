const User = require('../model/Users');
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
 
require("dotenv").config();

const handleLogin = async (req, res) => {
  const { user, pwd } = req.body;
  if (!user || !pwd)
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  const foundUser = await User.findOne({email: user}).exec();
  console.log(foundUser)
  if (!foundUser) return res.status(401).json({ message: "Invalid credentials (user not found)." });; //Unauthorized
  // evaluate password
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (match) {
    const accountType = foundUser.accountType;
    // create JWTs
    // console.log(process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
      { "UserInfo":{
        "id": foundUser._id,
        "email": foundUser.email,
        "accountType": accountType
      },

      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { "id": foundUser._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    // Saving refreshToken with current user
     foundUser.refreshToken = refreshToken
     const result = await foundUser.save();
    //  console.log(result)

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      // secure: true,
      maxAge: 24 * 60 * 60 * 1000 * 7,
    });
    res.json({ accessToken });
  } else {
    res.sendStatus(401);
    console.log("here")
  }
};

module.exports = { handleLogin };
