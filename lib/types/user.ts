import { Document, Model, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  phoneNumber?: string;
  email: string;
  profileImage: string;
  profileImagePublicId?: string;
  role: 'user' | 'admin';
  eyes: number;
  age?: number;
  isActive: boolean;
  passwordHash: string;
  userGameDetails: Types.ObjectId[];
  referralCode?: string;
  referrals: Array<{ id: string; createdAt: Date }>;
  monthlyDurationPlayed: number;
  yearlyDurationPlayed: number;
  wallet?: Types.ObjectId;
  tags: string[];
  pushToken?: string;
  pushTokens: Array<{ token: string; device: string; lastUsed: Date }>;
  notificationPreferences: {
    enabled: boolean;
    gameStart: boolean;
    gameEnd: boolean;
    friendActivity: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  initials: string;
  getPublicProfile(): object;
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

export interface IUserGameDetails extends Document {
  userId: Types.ObjectId;
  games: Types.ObjectId[];
  score: number;
  level: number;
  eyes: number;
  gamesPlayed: number;
  yearlyPosition: number;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}