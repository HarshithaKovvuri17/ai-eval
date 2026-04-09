const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  const user = await User.findOne({ email: 'csrkurupudi2005@gmail.com' });
  if (user) {
    console.log('User found:', user.email);
    console.log('Role:', user.role);
    // Note: Don't log the hash, just confirm existence
  } else {
    console.log('User NOT found');
  }
  process.exit(0);
}

checkUser().catch(console.error);
