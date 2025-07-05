import mongoose from "mongoose";

const DeliveryAttemptSchema = new mongoose.Schema({
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
  response: mongoose.Schema.Types.Mixed
});

const MessageDeliverySchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slackUserId: {
    type: String,
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
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  attempts: [DeliveryAttemptSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

MessageDeliverySchema.index({
  status: 1,
  type: 1,
  scheduledTime: 1
});

export default mongoose.models.MessageDelivery || mongoose.model('MessageDelivery', MessageDeliverySchema);