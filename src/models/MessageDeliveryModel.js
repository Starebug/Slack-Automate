"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var DeliveryAttemptSchema = new mongoose_1.default.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        required: true
    },
    error: String,
    response: mongoose_1.default.Schema.Types.Mixed
});
var MessageDeliverySchema = new mongoose_1.default.Schema({
    messageId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    slackChannelId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['immediate', 'scheduled'],
        required: true
    },
    scheduledTime: Date,
    status: {
        type: String,
        enum: ['queued', 'sent', 'failed', 'cancelled'],
        default: 'queued'
    },
    agendaJobId: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: null
    },
    attempts: [DeliveryAttemptSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Index for faster querying of pending scheduled messages
MessageDeliverySchema.index({
    status: 1,
    type: 1,
    scheduledTime: 1
});
// Check if model already exists to prevent OverwriteModelError
exports.default = mongoose_1.default.models.MessageDelivery || mongoose_1.default.model('MessageDelivery', MessageDeliverySchema);
