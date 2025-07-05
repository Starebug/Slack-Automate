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
var agenda_1 = require("../lib/agenda");
var dbConnect_1 = require("../lib/dbConnect");
var MessageDeliveryModel_1 = require("../models/MessageDeliveryModel");
var slackTokenManager_1 = require("../lib/slackTokenManager");
agenda_1.agenda.define('send-scheduled-message', function (job) { return __awaiter(void 0, void 0, void 0, function () {
    var deliveryId, delivery, user, message, accessToken, slackResponse, responseData, errorMessage, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, dbConnect_1.default)()];
            case 1:
                _a.sent();
                deliveryId = job.attrs.data.deliveryId;
                if (!deliveryId)
                    return [2 /*return*/];
                return [4 /*yield*/, MessageDeliveryModel_1.default.findById(deliveryId).populate('messageId').populate('userId')];
            case 2:
                delivery = _a.sent();
                if (!delivery || delivery.status !== 'queued')
                    return [2 /*return*/];
                user = delivery.userId;
                message = delivery.messageId;
                if (!(!user || !user.slackUserId)) return [3 /*break*/, 4];
                return [4 /*yield*/, MessageDeliveryModel_1.default.findByIdAndUpdate(delivery._id, {
                        status: 'failed',
                        $push: {
                            attempts: {
                                timestamp: new Date(),
                                status: 'failure',
                                error: 'User or slackUserId not found',
                            },
                        },
                    })];
            case 3:
                _a.sent();
                return [2 /*return*/];
            case 4:
                _a.trys.push([4, 14, , 16]);
                return [4 /*yield*/, (0, slackTokenManager_1.getValidAccessTokenBySlackUserId)(user.slackUserId)];
            case 5:
                accessToken = _a.sent();
                if (!!accessToken) return [3 /*break*/, 7];
                return [4 /*yield*/, MessageDeliveryModel_1.default.findByIdAndUpdate(delivery._id, {
                        status: 'failed',
                        $push: {
                            attempts: {
                                timestamp: new Date(),
                                status: 'failure',
                                error: 'Unable to get valid access token',
                            },
                        },
                    })];
            case 6:
                _a.sent();
                return [2 /*return*/];
            case 7: return [4 /*yield*/, fetch('https://slack.com/api/chat.postMessage', {
                    method: 'POST',
                    headers: {
                        'Authorization': "Bearer ".concat(accessToken),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        channel: delivery.slackChannelId,
                        text: message.text,
                    }),
                })];
            case 8:
                slackResponse = _a.sent();
                return [4 /*yield*/, slackResponse.json()];
            case 9:
                responseData = _a.sent();
                if (!responseData.ok) return [3 /*break*/, 11];
                // Update delivery status to sent
                return [4 /*yield*/, MessageDeliveryModel_1.default.findByIdAndUpdate(delivery._id, {
                        status: 'sent',
                        $push: {
                            attempts: {
                                timestamp: new Date(),
                                status: 'success',
                                response: responseData
                            }
                        }
                    })];
            case 10:
                // Update delivery status to sent
                _a.sent();
                console.log("Message sent successfully for delivery ".concat(deliveryId));
                return [3 /*break*/, 13];
            case 11:
                errorMessage = responseData.error || 'Failed to send message';
                if (responseData.error === 'missing_scope') {
                    errorMessage = 'Your Slack app needs additional permissions. Please sign out and sign in again to grant the required permissions.';
                    console.error("Scope error for delivery ".concat(deliveryId, ": User needs to re-authenticate with proper permissions"));
                }
                else if (responseData.error === 'channel_not_found') {
                    errorMessage = 'Channel not found. Please check the channel ID and ensure the app is added to the channel.';
                    console.error("Channel not found for delivery ".concat(deliveryId, ": ").concat(delivery.slackChannelId));
                }
                else if (responseData.error === 'not_in_channel') {
                    errorMessage = 'The app is not in this channel. Please add the app to the channel first.';
                    console.error("App not in channel for delivery ".concat(deliveryId, ": ").concat(delivery.slackChannelId));
                }
                else if (responseData.error === 'token_expired') {
                    errorMessage = 'Your Slack connection has expired. Please sign out and sign in again.';
                    console.error("Token expired for delivery ".concat(deliveryId, ": User needs to re-authenticate"));
                }
                // Update delivery status to failed
                return [4 /*yield*/, MessageDeliveryModel_1.default.findByIdAndUpdate(delivery._id, {
                        status: 'failed',
                        $push: {
                            attempts: {
                                timestamp: new Date(),
                                status: 'failure',
                                error: responseData.error,
                                response: responseData
                            }
                        }
                    })];
            case 12:
                // Update delivery status to failed
                _a.sent();
                console.log("Message failed for delivery ".concat(deliveryId, ":"), errorMessage);
                _a.label = 13;
            case 13: return [3 /*break*/, 16];
            case 14:
                error_1 = _a.sent();
                // Update delivery status to failed
                return [4 /*yield*/, MessageDeliveryModel_1.default.findByIdAndUpdate(delivery._id, {
                        status: 'failed',
                        $push: {
                            attempts: {
                                timestamp: new Date(),
                                status: 'failure',
                                error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                            }
                        }
                    })];
            case 15:
                // Update delivery status to failed
                _a.sent();
                console.error("Error processing delivery ".concat(deliveryId, ":"), error_1);
                return [3 /*break*/, 16];
            case 16: return [2 /*return*/];
        }
    });
}); });
agenda_1.agenda.start();
