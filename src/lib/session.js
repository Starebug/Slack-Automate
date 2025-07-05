"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = getSession;
var jwt = require("jsonwebtoken");
function getSession(req) {
    var _a;
    var cookie = (_a = req.cookies.get('slackconnect_token')) === null || _a === void 0 ? void 0 : _a.value;
    if (!cookie)
        return null;
    try {
        var user = jwt.verify(cookie, process.env.JWT_SECRET);
        return user;
    }
    catch (e) {
        return null;
    }
}
