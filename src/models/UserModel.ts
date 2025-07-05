import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true
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
  toJSON: { getters: true },
  toObject: { getters: true }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);