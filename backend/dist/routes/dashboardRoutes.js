"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get("/summary", auth_1.authenticateToken, dashboardController_1.getDashboardStats);
exports.default = router;
