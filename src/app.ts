import crypto from "crypto";
import express, {
    NextFunction,
    Request,
    Response
} from "express";

import {
    closeDatabaseConnection,
    connectToDatabase
} from "./db";

import {
    checkFeatureAccess
} from "./accessService";

import {
    FeatureName,
    User
} from "./types";

import {
    logger
} from "./logger";

const app = express();
const port = 3000;

app.use(express.json());

app.use(
    (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const requestId = crypto.randomUUID();

        res.locals.requestId = requestId;

        logger.info({
            event: "request_received",
            requestId,
            method: req.method,
            path: req.path
        });

        next();
    }
);

async function main(): Promise<void> {
    const db = await connectToDatabase();

    app.get(
        "/health",
        (_req: Request, res: Response) => {
            res.json({
                status: "ok"
            });
        }
    );

    app.get(
        "/users/:email",
        async (req: Request<{email: string}>, res: Response) => {
            try {
                const email =
                    req.params.email.toLowerCase();

                const users =
                    db.collection<User>("users");

                const user = await users.findOne(
                    {
                        email
                    },
                    {
                        projection: {
                            email: 1,
                            displayName: 1,
                            accountId: 1,
                            status: 1
                        }
                    }
                );

                if (!user) {
                    logger.warn({
                        event: "user_lookup_failed",
                        requestId: res.locals.requestId,
                        email
                    });

                    res.status(404).json({
                        error: "User not found"
                    });

                    return;
                }

                logger.info({
                    event: "user_lookup_succeeded",
                    requestId: res.locals.requestId,
                    userId: user._id.toHexString(),
                    email
                });

                res.json(user);
            } catch (error: unknown) {
                logger.error({
                    event: "user_lookup_error",
                    requestId: res.locals.requestId,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error"
                });

                res.status(500).json({
                    error: "Internal server error"
                });
            }
        }
    );

    app.get(
        "/users/:email/features/:feature",
        async (req: Request<{email: string; feature: string}>, res: Response) => {
            try {
                const email =
                    req.params.email.toLowerCase();

                const feature =
                    req.params.feature;

                if (!isFeatureName(feature)) {
                    res.status(400).json({
                        error: "Unknown feature"
                    });

                    return;
                }

                const result =
                    await checkFeatureAccess(
                        db,
                        email,
                        feature
                    );

                if (!result.allowed) {
                    logger.warn({
                        event: "feature_access_denied",
                        requestId: res.locals.requestId,
                        email,
                        userId:
                            result.user?._id.toHexString(),
                        accountId:
                            result.account?._id.toHexString(),
                        feature,
                        plan:
                            result.account?.subscription.plan,
                        reason: result.reason
                    });

                    res.status(403).json({
                        allowed: false,
                        feature,
                        reason: result.reason
                    });

                    return;
                }

                logger.info({
                    event: "feature_access_allowed",
                    requestId: res.locals.requestId,
                    email,
                    userId:
                        result.user?._id.toHexString(),
                    accountId:
                        result.account?._id.toHexString(),
                    feature,
                    plan:
                        result.account?.subscription.plan
                });

                res.json({
                    allowed: true,
                    feature,
                    reason: result.reason
                });
            } catch (error: unknown) {
                logger.error({
                    event: "feature_access_error",
                    requestId: res.locals.requestId,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error"
                });

                res.status(500).json({
                    error: "Internal server error"
                });
            }
        }
    );

    const server = app.listen(
        port,
        () => {
            console.log(
                `SupportLab API listening on http://localhost:${port}`
            );

            logger.info({
                event: "application_started",
                port
            });
        }
    );

    async function shutdown(): Promise<void> {
        console.log(
            "\nShutting down SupportLab..."
        );

        server.close(async () => {
            await closeDatabaseConnection();
            process.exit(0);
        });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

function isFeatureName(
    value: string
): value is FeatureName {
    return [
        "exportCsv",
        "auditLogs",
        "apiAccess"
    ].includes(value);
}

main().catch((error: unknown) => {
    console.error(
        "Application failed:",
        error
    );

    logger.fatal({
        event: "application_start_failed",
        error:
            error instanceof Error
                ? error.message
                : "Unknown error"
    });

    process.exit(1);
});