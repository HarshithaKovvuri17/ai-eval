const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  const user = await User.findOne({ email: 'csrkurupudi2005@gmail.com' }).select('+password');
  if (!user) {
    console.log('User not found');
    process.exit(0);
  }
  const match = await bcrypt.compare('charan', user.password);
  console.log('Password match:', match);
  process.exit(0);
}

verify().catch(console.error);
