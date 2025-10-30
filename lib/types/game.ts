import { Document, Types } from 'mongoose';

export interface IGameCharacter {
  name: string;
  image: string;  // base64 image
}

export interface IGame extends Document {
  _id: Types.ObjectId;
  title: string;
  startTime: string;
  startDate: string;
  durationInMinutes: number;
  friends: IGameCharacter[];  // Changed to array of objects
  enemies: IGameCharacter[];  // Changed to array of objects
  friendDescription?: string;
  enemyDescription?: string;
  showFriendImages: boolean;
  showEnemyImages: boolean;
  players: Types.ObjectId[];
  connectedUsers: number;
  connectedUsersArray: string[];
  readyUsers: number;
  readyUsersArray: string[];
  price: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}