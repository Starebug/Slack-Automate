"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.refreshSlackToken = refreshSlackToken;
exports.isTokenExpired = isTokenExpired;
exports.isTokenNearExpiry = isTokenNearExpiry;
exports.getValidAccessTokenBySlackUserId = getValidAccessTokenBySlackUserId;
exports.getValidAccessToken = getValidAccessToken;
exports.makeSlackApiCall = makeSlackApiCall;
var UserModel_1 = require("@/models/UserModel");
var dbConnect_1 = require("./dbConnect");
var session_1 = require("./session");
// Function to refresh Slack token
function refreshSlackToken(refreshToken) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('https://slack.com/api/oauth.v2.access', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: new URLSearchParams({
                                client_id: process.env.AUTH_SLACK_ID,
                                client_secret: process.env.AUTH_SLACK_SECRET,
                                grant_type: 'refresh_token',
                                refresh_token: refreshToken,
                            }).toString(),
                        })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (!data.ok) {
                        console.error('Token refresh failed:', data.error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, {
                            access_token: data.access_token,
                            refresh_token: data.refresh_token,
                            expires_in: data.expires_in,
                            token_type: data.token_type,
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error refreshing token:', error_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Function to check if token is expired
function isTokenExpired(expiresAt) {
    return new Date() >= expiresAt;
}
// Function to check if token is near expiry (within 1 hour)
function isTokenNearExpiry(expiresAt) {
    var oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return expiresAt <= oneHourFromNow;
}
// Function to get a valid access token for a user by slackUserId
function getValidAccessTokenBySlackUserId(slackUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, refreshResult, newExpiresAt, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    return [4 /*yield*/, (0, dbConnect_1.default)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, UserModel_1.default.findOne({ slackUserId: slackUserId })];
                case 2:
                    user = _a.sent();
                    if (!user || !user.slackAccessToken) {
                        console.log('No user or access token found for slackUserId:', slackUserId);
                        return [2 /*return*/, null];
                    }
                    if (!(user.tokenExpiresAt && (isTokenExpired(user.tokenExpiresAt) || isTokenNearExpiry(user.tokenExpiresAt)))) return [3 /*break*/, 9];
                    console.log('Token expired or near expiry for user:', slackUserId);
                    if (!user.slackRefreshToken) return [3 /*break*/, 8];
                    console.log('Attempting to refresh token for user:', slackUserId);
                    return [4 /*yield*/, refreshSlackToken(user.slackRefreshToken)];
                case 3:
                    refreshResult = _a.sent();
                    if (!refreshResult) return [3 /*break*/, 5];
                    newExpiresAt = new Date(Date.now() + (refreshResult.expires_in * 1000));
                    return [4 /*yield*/, UserModel_1.default.findOneAndUpdate({ slackUserId: slackUserId }, {
                            slackAccessToken: refreshResult.access_token,
                            slackRefreshToken: refreshResult.refresh_token,
                            tokenExpiresAt: newExpiresAt,
                        })];
                case 4:
                    _a.sent();
                    console.log('Token refreshed successfully for user:', slackUserId);
                    return [2 /*return*/, refreshResult.access_token];
                case 5:
                    // Refresh failed, remove invalid tokens
                    console.log('Token refresh failed for user:', slackUserId);
                    return [4 /*yield*/, UserModel_1.default.findOneAndUpdate({ slackUserId: slackUserId }, {
                            slackAccessToken: null,
                            slackRefreshToken: null,
                            tokenExpiresAt: null,
                        })];
                case 6:
                    _a.sent();
                    return [2 /*return*/, null];
                case 7: return [3 /*break*/, 9];
                case 8:
                    // No refresh token available
                    console.log('No refresh token available for user:', slackUserId);
                    return [2 /*return*/, null];
                case 9:
                    // Token is still valid
                    console.log('Token is valid for user:', slackUserId);
                    return [2 /*return*/, user.slackAccessToken];
                case 10:
                    error_2 = _a.sent();
                    console.error('Error getting valid access token for slackUserId:', slackUserId, error_2);
                    return [2 /*return*/, null];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Function to get a valid access token for a user by email (legacy)
function getValidAccessToken(userEmail) {
    return __awaiter(this, void 0, void 0, function () {
        var user, refreshResult, newExpiresAt, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    return [4 /*yield*/, (0, dbConnect_1.default)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, UserModel_1.default.findOne({ email: userEmail })];
                case 2:
                    user = _a.sent();
                    if (!user || !user.slackAccessToken) {
                        return [2 /*return*/, null];
                    }
                    if (!(user.tokenExpiresAt && isTokenExpired(user.tokenExpiresAt))) return [3 /*break*/, 9];
                    if (!user.slackRefreshToken) return [3 /*break*/, 8];
                    return [4 /*yield*/, refreshSlackToken(user.slackRefreshToken)];
                case 3:
                    refreshResult = _a.sent();
                    if (!refreshResult) return [3 /*break*/, 5];
                    newExpiresAt = new Date(Date.now() + (refreshResult.expires_in * 1000));
                    return [4 /*yield*/, UserModel_1.default.findOneAndUpdate({ email: userEmail }, {
                            slackAccessToken: refreshResult.access_token,
                            slackRefreshToken: refreshResult.refresh_token,
                            tokenExpiresAt: newExpiresAt,
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, refreshResult.access_token];
                case 5: 
                // Refresh failed, remove invalid tokens
                return [4 /*yield*/, UserModel_1.default.findOneAndUpdate({ email: userEmail }, {
                        slackAccessToken: null,
                        slackRefreshToken: null,
                        tokenExpiresAt: null,
                    })];
                case 6:
                    // Refresh failed, remove invalid tokens
                    _a.sent();
                    return [2 /*return*/, null];
                case 7: return [3 /*break*/, 9];
                case 8: 
                // No refresh token available
                return [2 /*return*/, null];
                case 9: 
                // Token is still valid
                return [2 /*return*/, user.slackAccessToken];
                case 10:
                    error_3 = _a.sent();
                    console.error('Error getting valid access token:', error_3);
                    return [2 /*return*/, null];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Function to make authenticated Slack API calls with automatic token refresh
function makeSlackApiCall(req_1, endpoint_1) {
    return __awaiter(this, arguments, void 0, function (req, endpoint, options) {
        var session, accessToken, response;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    session = (0, session_1.getSession)(req);
                    if (!(session === null || session === void 0 ? void 0 : session.slackUserId)) {
                        throw new Error('No valid session or slackUserId available');
                    }
                    return [4 /*yield*/, getValidAccessTokenBySlackUserId(session.slackUserId)];
                case 1:
                    accessToken = _a.sent();
                    if (!accessToken) {
                        throw new Error('No valid access token available');
                    }
                    return [4 /*yield*/, fetch("https://slack.com/api/".concat(endpoint), __assign(__assign({}, options), { headers: __assign({ 'Authorization': "Bearer ".concat(accessToken), 'Content-Type': 'application/json' }, options.headers) }))];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response.json()];
            }
        });
    });
}
