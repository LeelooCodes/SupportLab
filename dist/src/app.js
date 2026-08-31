"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const accessService_1 = require("./accessService");
const logger_1 = require("./logger");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use((req, res, next) => {
    const requestId = crypto_1.default.randomUUID();
    res.locals.requestId = requestId;
    logger_1.logger.info({
        event: "request_received",
        requestId,
        method: req.method,
        path: req.path
    });
    next();
});
async function main() {
    const db = await (0, db_1.connectToDatabase)();
    app.get("/health", (_req, res) => {
        res.json({
            status: "ok"
        });
    });
    app.get("/users/:email", async (req, res) => {
        try {
            const email = req.params.email.toLowerCase();
            const users = db.collection("users");
            const user = await users.findOne({
                email
            }, {
                projection: {
                    email: 1,
                    displayName: 1,
                    accountId: 1,
                    status: 1
                }
            });
            if (!user) {
                logger_1.logger.warn({
                    event: "user_lookup_failed",
                    requestId: res.locals.requestId,
                    email
                });
                res.status(404).json({
                    error: "User not found"
                });
                return;
            }
            logger_1.logger.info({
                event: "user_lookup_succeeded",
                requestId: res.locals.requestId,
                userId: user._id.toHexString(),
                email
            });
            res.json(user);
        }
        catch (error) {
            logger_1.logger.error({
                event: "user_lookup_error",
                requestId: res.locals.requestId,
                error: error instanceof Error
                    ? error.message
                    : "Unknown error"
            });
            res.status(500).json({
                error: "Internal server error"
            });
        }
    });
    app.get("/users/:email/features/:feature", async (req, res) => {
        try {
            const email = req.params.email.toLowerCase();
            const feature = req.params.feature;
            if (!isFeatureName(feature)) {
                res.status(400).json({
                    error: "Unknown feature"
                });
                return;
            }
            const result = await (0, accessService_1.checkFeatureAccess)(db, email, feature);
            if (!result.allowed) {
                logger_1.logger.warn({
                    event: "feature_access_denied",
                    requestId: res.locals.requestId,
                    email,
                    userId: result.user?._id.toHexString(),
                    accountId: result.account?._id.toHexString(),
                    feature,
                    plan: result.account?.subscription.plan,
                    reason: result.reason
                });
                res.status(403).json({
                    allowed: false,
                    feature,
                    reason: result.reason
                });
                return;
            }
            logger_1.logger.info({
                event: "feature_access_allowed",
                requestId: res.locals.requestId,
                email,
                userId: result.user?._id.toHexString(),
                accountId: result.account?._id.toHexString(),
                feature,
                plan: result.account?.subscription.plan
            });
            res.json({
                allowed: true,
                feature,
                reason: result.reason
            });
        }
        catch (error) {
            logger_1.logger.error({
                event: "feature_access_error",
                requestId: res.locals.requestId,
                error: error instanceof Error
                    ? error.message
                    : "Unknown error"
            });
            res.status(500).json({
                error: "Internal server error"
            });
        }
    });
    const server = app.listen(port, () => {
        console.log(`SupportLab API listening on http://localhost:${port}`);
        logger_1.logger.info({
            event: "application_started",
            port
        });
    });
    async function shutdown() {
        console.log("\nShutting down SupportLab...");
        server.close(async () => {
            await (0, db_1.closeDatabaseConnection)();
            process.exit(0);
        });
    }
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
function isFeatureName(value) {
    return [
        "exportCsv",
        "auditLogs",
        "apiAccess"
    ].includes(value);
}
main().catch((error) => {
    console.error("Application failed:", error);
    logger_1.logger.fatal({
        event: "application_start_failed",
        error: error instanceof Error
            ? error.message
            : "Unknown error"
    });
    process.exit(1);
});
