import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../lib/models/User';


async function createAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User Schema
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      passwordHash: String,
      role: String,
      profileImage: String,
      profileImagePublicId: String,
      phoneNumber: String,
      isActive: Boolean,
      eyes: Number,
      age: Number,
      userGameDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserGameDetails' }],
      referrals: [{ id: String, createdAt: Date }],
      monthlyDurationPlayed: Number,
      yearlyDurationPlayed: Number,
      tags: [String],
      pushToken: String,
      pushTokens: [{ token: String, device: String, lastUsed: Date }],
      notificationPreferences: {
        enabled: Boolean,
        gameStart: Boolean,
        gameEnd: Boolean,
        friendActivity: Boolean,
      }
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL is not defined in environment variables');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const password = process.env.ADMIN_PASSWORD ;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
      profileImage: 'https://via.placeholder.com/150',
      profileImagePublicId: '',
      phoneNumber: '',
      isActive: true,
      eyes: 0,
      age: 30,
      userGameDetails: [],
      referrals: [],
      monthlyDurationPlayed: 0,
      yearlyDurationPlayed: 0,
      tags: [],
      pushToken: null,
      pushTokens: [],
      notificationPreferences: {
        enabled: true,
        gameStart: true,
        gameEnd: true,
        friendActivity: true,
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

// npx tsx --env-file=.env scripts/createAdmin.ts