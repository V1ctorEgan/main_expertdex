const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./model/Users");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");
// mongoose.connect(process.env.DATABASE_URI);
connectDB();
async function createAdmin() {
  const hashedPwd = await bcrypt.hash("admin123", 10);

  const admin = await User.create({
    name: "Admin User",
    email: "admin@logistics.com",
    password: hashedPwd,
    accountType: "admin",
    phoneNumber: 1234567890,
    // isVerified: true,
  });

  console.log("Admin created:", admin);
  process.exit(0);
}

createAdmin();
