import mongoose, { Schema } from "mongoose";
import { IGame } from "../types/game";

// Delete the cached model to prevent issues with Next.js hot reloading
if (mongoose.models.Game) {
  delete mongoose.models.Game;
}



const GameSchema = new Schema<IGame>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    durationInMinutes: {
      type: Number,
      required: true,
    },
    // Friends with images - use the CharacterSchema
    friends: {
      type: [String],
      default: [],
    },
    // Enemies with images - use the CharacterSchema
    enemies: {
      type: [String],
      default: [],
    },
    friendDescription: {
      type: String,
      default: "",
      trim: true,
    },
    enemyDescription: {
      type: String,
      default: "",
      trim: true,
    },
    showFriendImages: {
      type: Boolean,
      default: true,
    },
    showEnemyImages: {
      type: Boolean,
      default: true,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    connectedUsers: {
      type: Number,
      default: 0,
    },
    connectedUsersArray: {
      type: [String],
      default: [],
    },
    readyUsers: {
      type: Number,
      default: 0,
    },
    readyUsersArray: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Game = mongoose.model<IGame>("Game", GameSchema);