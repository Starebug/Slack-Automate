"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var UserSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        unique: true,
        sparse: true // Allows null values but enforces uniqueness for non-null
    },
    slackUserId: {
        type: String,
        required: true,
        unique: true
    },
    slackTeamId: {
        type: String,
        required: true
    },
    slackAccessToken: {
        type: String,
        required: true,
    },
    slackRefreshToken: {
        type: String,
        required: true
    },
    tokenExpiresAt: {
        type: Date,
        required: true
    },
    scopes: [{
            type: String
        }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    slackUserAccessToken: {
        type: String,
        required: false
    },
}, {
    timestamps: true,
    toJSON: { getters: true }, // Applies getters when converting to JSON
    toObject: { getters: true }
});
UserSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Check if model already exists to prevent OverwriteModelError
exports.default = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
