"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var bcrypt = require("bcryptjs");
var mongoose_1 = require("mongoose");
function createAdmin() {
    return __awaiter(this, void 0, void 0, function () {
        var userSchema, User_1, adminEmail, existingAdmin, password, hashedPassword, admin, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    if (!process.env.MONGODB_URI) {
                        throw new Error('MONGODB_URI is not defined in environment variables');
                    }
                    // Connect to MongoDB
                    return [4 /*yield*/, mongoose_1.default.connect(process.env.MONGODB_URI)];
                case 1:
                    // Connect to MongoDB
                    _a.sent();
                    console.log('✅ Connected to MongoDB');
                    userSchema = new mongoose_1.default.Schema({
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
                        userGameDetails: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'UserGameDetails' }],
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
                    User_1 = mongoose_1.default.models.User || mongoose_1.default.model('User', userSchema);
                    adminEmail = process.env.ADMIN_EMAIL;
                    if (!adminEmail) {
                        throw new Error('ADMIN_EMAIL is not defined in environment variables');
                    }
                    return [4 /*yield*/, User_1.findOne({ email: adminEmail })];
                case 2:
                    existingAdmin = _a.sent();
                    if (!existingAdmin) return [3 /*break*/, 4];
                    console.log('⚠️  Admin user already exists!');
                    console.log('Email:', existingAdmin.email);
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
                case 4:
                    password = process.env.ADMIN_PASSWORD;
                    if (!password) {
                        throw new Error('ADMIN_PASSWORD is not defined in environment variables');
                    }
                    return [4 /*yield*/, bcrypt.hash(password, 10)];
                case 5:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, User_1.create({
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
                        })];
                case 6:
                    admin = _a.sent();
                    console.log('✅ Admin user created successfully!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('📧 Email:', admin.email);
                    console.log('🔑 Password:', password);
                    console.log('👤 Role:', admin.role);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 7:
                    _a.sent();
                    console.log('✅ Disconnected from MongoDB');
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.error('❌ Error creating admin:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
createAdmin();
// npx tsx --env-file=.env scripts/createAdmin.ts
