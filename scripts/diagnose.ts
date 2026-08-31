import {
    Document
} from "mongodb";

import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

import {
    isCurrentAccount
} from "../src/accountValidation";

import {
    normalizeEmail
} from "../src/normalization";

import {
    expectedEntitlements
} from "../src/planConfig";

import {
    logger
} from "../src/logger";

import {
    FeatureName,
    User
} from "../src/types";

const features: FeatureName[] = [
    "exportCsv",
    "auditLogs",
    "apiAccess"
];

function formatBoolean(
    value: boolean
): string {
    return value
        ? "enabled"
        : "disabled";
}

function pass(
    message: string
): void {
    console.log(
        `  [PASS] ${message}`
    );
}

function warn(
    message: string
): void {
    console.log(
        `  [WARN] ${message}`
    );
}

async function diagnoseUser(
    emailArgument: string
): Promise<void> {
    const db = await connectToDatabase();

    try {
        const requestedEmail =
            emailArgument.trim();

        const canonicalEmail =
            normalizeEmail(requestedEmail);

        const users =
            db.collection<User>("users");

        const accounts =
            db.collection<Document>("accounts");

        console.log();
        console.log(
            "=== SUPPORTLAB USER DIAGNOSTIC ==="
        );
        console.log();

        const user = await users.findOne(
            {
                email: canonicalEmail
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
            console.log("User");
            console.log(
                `  Requested Email: ${requestedEmail}`
            );
            console.log(
                `  Canonical Email: ${canonicalEmail}`
            );
            console.log(
                "  Result: USER NOT FOUND"
            );

            logger.warn({
                event:
                    "diagnostic_user_not_found",
                requestedEmail,
                canonicalEmail
            });

            return;
        }

        console.log("User");
        console.log(
            `  Name: ${user.displayName}`
        );
        console.log(
            `  Email: ${user.email}`
        );
        console.log(
            `  Status: ${user.status}`
        );
        console.log(
            `  User ID: ${user._id.toHexString()}`
        );
        console.log(
            `  Account ID: ${user.accountId.toHexString()}`
        );
        console.log();

        const account =
            await accounts.findOne(
                {
                    _id: user.accountId
                },
                {
                    projection: {
                        name: 1,
                        schemaVersion: 1,
                        subscription: 1,
                        entitlements: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            );

        if (!account) {
            console.log("Account");
            console.log(
                "  Result: LINKED ACCOUNT NOT FOUND"
            );

            logger.warn({
                event:
                    "diagnostic_account_not_found",
                userId:
                    user._id.toHexString(),
                accountId:
                    user.accountId.toHexString()
            });

            return;
        }

        console.log("Account");
        console.log(
            `  Name: ${String(account.name)}`
        );
        console.log(
            `  Schema Version: ${String(
                account.schemaVersion
            )}`
        );

        if (!isCurrentAccount(account)) {
            console.log();
            console.log("Checks");

            warn(
                "Account does not conform to the current V2 schema."
            );

            logger.warn({
                event:
                    "diagnostic_legacy_or_invalid_account",
                userId:
                    user._id.toHexString(),
                accountId:
                    account._id.toString(),
                schemaVersion:
                    account.schemaVersion
            });

            console.log();
            console.log("Result");
            console.log(
                "  Manual investigation or migration required."
            );

            return;
        }

        console.log(
            `  Plan: ${account.subscription.plan}`
        );
        console.log(
            `  Subscription Status: ${account.subscription.status}`
        );
        console.log();

        console.log("Entitlements");
        console.log(
            `  CSV Export: ${formatBoolean(
                account.entitlements.exportCsv
            )}`
        );
        console.log(
            `  Audit Logs: ${formatBoolean(
                account.entitlements.auditLogs
            )}`
        );
        console.log(
            `  API Access: ${formatBoolean(
                account.entitlements.apiAccess
            )}`
        );
        console.log();

        console.log("Checks");

        let warnings = 0;

        if (
            user.email ===
            normalizeEmail(user.email)
        ) {
            pass(
                "User email is canonical."
            );
        } else {
            warnings++;

            warn(
                `Stored email is not canonical: ${user.email}`
            );
        }

        pass(
            "Account uses current schema V2."
        );

        if (
            account.subscription.status ===
            "active"
        ) {
            pass(
                "Account subscription is active."
            );
        } else {
            warnings++;

            warn(
                `Subscription status is ${account.subscription.status}.`
            );
        }

        const expected =
            expectedEntitlements[
                account.subscription.plan
            ];

        for (const feature of features) {
            const actualValue =
                account.entitlements[feature];

            const expectedValue =
                expected[feature];

            if (
                actualValue ===
                expectedValue
            ) {
                pass(
                    `${feature} matches expected ${account.subscription.plan} configuration.`
                );
            } else {
                warnings++;

                warn(
                    `${feature} is ${actualValue}, expected ${expectedValue} for ${account.subscription.plan}.`
                );
            }
        }

        console.log();
        console.log("Result");

        if (warnings === 0) {
            console.log(
                "  No obvious account-health issues detected."
            );
        } else {
            console.log(
                `  ${warnings} warning(s) require investigation.`
            );
        }

        logger.info({
            event:
                "diagnostic_user_completed",
            userId:
                user._id.toHexString(),
            accountId:
                account._id.toHexString(),
            warnings
        });
    } finally {
        await closeDatabaseConnection();
    }
}

const emailArgument =
    process.argv[2];

if (!emailArgument) {
    console.error(
        "Usage: npm run diagnose -- user@example.com"
    );

    process.exit(1);
}

diagnoseUser(emailArgument).catch(
    (error: unknown) => {
        logger.error({
            event:
                "diagnostic_user_failed",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error"
        });

        console.error(
            "Diagnostic failed:",
            error
        );

        process.exit(1);
    }
);