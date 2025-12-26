"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var mongoose_1 = require("mongoose");
var userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [50, "Name cannot be more than 50 characters"],
    },
    phoneNumber: {
        type: String,
        required: false,
        trim: true,
        maxlength: [15, "Phone number cannot be more than 15 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email",
        ],
    },
    profileImage: {
        type: String,
        required: [true, "Profile image is required"],
        trim: true,
    },
    profileImagePublicId: {
        type: String,
        required: false,
        trim: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    eyes: {
        type: Number,
        default: 0,
    },
    age: {
        type: Number,
        min: [0, "Age cannot be negative"],
        max: [120, "Age cannot be more than 120"],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    passwordHash: {
        type: String,
        required: [true, "Password is required"],
    },
    userGameDetails: [
        {
            type: mongoose_1.default.Types.ObjectId,
            ref: "UserGameDetails",
        },
    ],
    referralCode: {
        type: String,
        unique: true,
        sparse: true,
    },
    referrals: {
        type: [{ id: String, createdAt: { type: Date, default: Date.now } }],
    },
    monthlyDurationPlayed: {
        type: Number,
        default: 0,
    },
    yearlyDurationPlayed: {
        type: Number,
        default: 0,
    },
    wallet: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Wallet",
    },
    tags: [
        {
            type: String,
            trim: true,
        },
    ],
    pushToken: {
        type: String,
        default: null,
    },
    pushTokens: [{
            token: String,
            device: String,
            lastUsed: Date,
        }],
    notificationPreferences: {
        enabled: {
            type: Boolean,
            default: true,
        },
        gameStart: {
            type: Boolean,
            default: true,
        },
        gameEnd: {
            type: Boolean,
            default: true,
        },
        friendActivity: {
            type: Boolean,
            default: true,
        },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema.virtual("initials").get(function () {
    return this.name
        .split(" ")
        .map(function (word) { return word[0]; })
        .join("")
        .toUpperCase();
});
userSchema.pre("save", function (next) {
    if (this.isModified("email")) {
        this.email = this.email.toLowerCase();
    }
    next();
});
userSchema.methods.getPublicProfile = function () {
    return {
        id: this.id.toString(),
        name: this.name,
        email: this.email,
        isActive: this.isActive,
    };
};
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};
exports.User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
