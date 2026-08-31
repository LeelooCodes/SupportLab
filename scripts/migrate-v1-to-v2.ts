import { Document } from "mongodb";

import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

import {
    Account,
    FeatureName,
    LegacyAccountV1,
    SubscriptionPlan
} from "../src/types";

import {
    logger
} from "../src/logger";

const validPlans: SubscriptionPlan[] = [
    "free",
    "pro",
    "enterprise"
];

const validFeatures: FeatureName[] = [
    "exportCsv",
    "auditLogs",
    "apiAccess"
];

function isSubscriptionPlan(
    value: unknown
): value is SubscriptionPlan {
    return (
        typeof value === "string" &&
        validPlans.includes(value as SubscriptionPlan)
    );
}

function isFeatureName(
    value: unknown
): value is FeatureName {
    return (
        typeof value === "string" &&
        validFeatures.includes(value as FeatureName)
    );
}

function isValidLegacyAccount(
    document: Document
): document is LegacyAccountV1 {
    return (
        document.schemaVersion === 1 &&
        typeof document.name === "string" &&
        isSubscriptionPlan(document.plan) &&
        typeof document.active === "boolean" &&
        Array.isArray(document.features) &&
        document.features.every(isFeatureName) &&
        document.createdAt instanceof Date &&
        document.updatedAt instanceof Date
    );
}

function transformLegacyAccount(
    account: LegacyAccountV1
): Omit<Account, "_id"> {
    const migratedAt = new Date();

    return {
        name: account.name,
        schemaVersion: 2,

        subscription: {
            plan: account.plan,
            status:
                account.active
                    ? "active"
                    : "cancelled"
        },

        entitlements: {
            exportCsv:
                account.features.includes("exportCsv"),

            auditLogs:
                account.features.includes("auditLogs"),

            apiAccess:
                account.features.includes("apiAccess")
        },

        createdAt: account.createdAt,
        updatedAt: migratedAt
    };
}

async function migrate(): Promise<void> {
    const dryRun =
        process.argv.includes("--dry-run");

    const db = await connectToDatabase();

    try {
        const accounts =
            db.collection<Document>("accounts");

        const legacyAccounts =
            await accounts
                .find({
                    schemaVersion: 1
                })
                .toArray();

        console.log(
            `Found ${legacyAccounts.length} V1 account(s).`
        );

        if (dryRun) {
            console.log(
                "DRY RUN: no database changes will be written."
            );
        }

        let migrated = 0;
        let invalid = 0;

        for (const document of legacyAccounts) {
            if (!isValidLegacyAccount(document)) {
                invalid++;

                logger.warn({
                    event: "migration_record_invalid",
                    accountId:
                        document._id?.toString(),
                    accountName:
                        document.name,
                    schemaVersion:
                        document.schemaVersion
                });

                console.warn(
                    `Skipping invalid legacy record: ${document._id}`
                );

                continue;
            }

            const transformed =
                transformLegacyAccount(document);

            console.log(
                `Migrating ${document.name} (${document._id})`
            );

            if (dryRun) {
                console.log({
                    fromVersion:
                        document.schemaVersion,

                    toVersion:
                        transformed.schemaVersion,

                    subscription:
                        transformed.subscription,

                    entitlements:
                        transformed.entitlements
                });

                continue;
            }

            const result =
                await accounts.updateOne(
                    {
                        _id: document._id,
                        schemaVersion: 1
                    },
                    {
                        $set: {
                            schemaVersion: 2,
                            subscription:
                                transformed.subscription,
                            entitlements:
                                transformed.entitlements,
                            updatedAt:
                                transformed.updatedAt
                        },

                        $unset: {
                            plan: "",
                            active: "",
                            features: ""
                        }
                    }
                );

            if (
                result.matchedCount !== 1 ||
                result.modifiedCount !== 1
            ) {
                logger.error({
                    event: "migration_update_failed",
                    accountId:
                        document._id.toString(),
                    matchedCount:
                        result.matchedCount,
                    modifiedCount:
                        result.modifiedCount
                });

                throw new Error(
                    `Migration update failed for ${document._id}`
                );
            }

            const migratedDocument =
                await accounts.findOne({
                    _id: document._id
                });

            if (
                !migratedDocument ||
                migratedDocument.schemaVersion !== 2 ||
                !migratedDocument.subscription ||
                !migratedDocument.entitlements
            ) {
                logger.error({
                    event:
                        "migration_validation_failed",
                    accountId:
                        document._id.toString()
                });

                throw new Error(
                    `Post-migration validation failed for ${document._id}`
                );
            }

            migrated++;

            logger.info({
                event:
                    "migration_record_completed",
                accountId:
                    document._id.toString(),
                accountName:
                    document.name,
                fromVersion: 1,
                toVersion: 2
            });
        }

        console.log();
        console.log("Migration summary:");
        console.log(`Migrated: ${migrated}`);
        console.log(`Invalid/skipped: ${invalid}`);

        logger.info({
            event: "migration_completed",
            migrated,
            invalid,
            dryRun
        });
    } finally {
        await closeDatabaseConnection();
    }
}

migrate().catch((error: unknown) => {
    logger.error({
        event: "migration_failed",
        error:
            error instanceof Error
                ? error.message
                : "Unknown error"
    });

    console.error(
        "Migration failed:",
        error
    );

    process.exit(1);
});