"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var MessageSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    blocks: [{
            type: mongoose_1.default.Schema.Types.Mixed // For Slack message blocks
        }],
    attachments: [{
            type: mongoose_1.default.Schema.Types.Mixed // For Slack attachments
        }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Check if model already exists to prevent OverwriteModelError
exports.default = mongoose_1.default.models.Message || mongoose_1.default.model('Message', MessageSchema);
