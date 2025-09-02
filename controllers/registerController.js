const User = require('../model/Users');

const bcrypt = require('bcryptjs');

const handleNewUser = async (req, res) => {
    const { name, user, pwd, accountType } = req.body;
    if (!user || !pwd || !accountType) return res.status(400).json({ 'message': 'Username and password are required.' });
    // check for duplicate usernames in the db
    const duplicate = await User.findOne({username: user}).exec();
    if (duplicate) return res.sendStatus(409); //Conflict 
    try {
        //encrypt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);
        //create and store the new user
        const result = await User.create({ 
            "name":name,
            "email": user,
            "password": hashedPwd,
            "accountType":accountType

        });
        console.log(result)
        
        res.status(201).json({ 'success': `New user ${user} created!` });
    } catch (err) {
        res.status(500).json({ 'message2': err.message });
    }
}

module.exports = { handleNewUser };