const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const { ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD } = process.env;

    if (!ADMIN_SEED_NAME || !ADMIN_SEED_EMAIL || !ADMIN_SEED_PASSWORD) {
      console.error('Missing required env vars: ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD');
      process.exit(1);
    }

    const existing = await User.findOne({ email: ADMIN_SEED_EMAIL });
    if (existing) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const admin = await User.create({
      name: ADMIN_SEED_NAME,
      email: ADMIN_SEED_EMAIL,
      password: ADMIN_SEED_PASSWORD,
      role: 'admin',
    });

    console.log('Admin user created:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();