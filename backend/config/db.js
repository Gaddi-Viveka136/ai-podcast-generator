const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('  MongoDB is not running. Choose one of these fixes:');
    console.error('');
    console.error('  OPTION 1 — Start local MongoDB:');
    console.error('    Run in a NEW terminal (as Admin):');
    console.error('    net start MongoDB');
    console.error('');
    console.error('  OPTION 2 — Use MongoDB Atlas (free cloud):');
    console.error('    1. Go to https://www.mongodb.com/atlas');
    console.error('    2. Sign up free → Create cluster (M0 free)');
    console.error('    3. Connect → Copy connection string');
    console.error('    4. Paste it as MONGO_URI in backend/.env');
    console.error('    5. In Atlas Network Access → Allow from anywhere');
    console.error('    6. Restart: npm run dev');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
};

module.exports = connectDB;
