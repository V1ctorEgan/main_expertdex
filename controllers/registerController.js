const User = require("../model/Users");

const bcrypt = require("bcryptjs");

const handleNewUser = async (req, res) => {
  console.log("Incoming req.body:", req.body);
  const { name, email, pwd, accountType, phoneNumber } = req.body;
  if (!email || !pwd || !accountType)
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  // check for duplicate usernames in the db
  const duplicate = await User.findOne({ username: email }).exec();
  if (duplicate) return res.sendStatus(409); //Conflict
  try {
    //encrypt the password
    const hashedPwd = await bcrypt.hash(pwd, 10);
    //create and store the new user
    const result = await User.create({
      name: name,
      email: email,
      password: hashedPwd,
      accountType: accountType,
      phoneNumber: phoneNumber,
    });
    console.log(result);

    res.status(201).json({ success: `New user ${email} created!` });
  } catch (err) {
    res.status(500).json({ message2: err.message });
  }
};

module.exports = { handleNewUser };
