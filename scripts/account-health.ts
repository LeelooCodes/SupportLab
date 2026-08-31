import {
    Document
} from "mongodb";

import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

interface AccountHealthSummary {
    plan: string;
    status: string;
    accountCount: number;
    userCount: number;
}

async function accountHealth(): Promise<void> {
    const db = await connectToDatabase();

    try {
        const accounts =
            db.collection<Document>("accounts");

        const summary =
            await accounts
                .aggregate<AccountHealthSummary>([
                    {
                        $match: {
                            schemaVersion: 2
                        }
                    },

                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "accountId",
                            as: "linkedUsers"
                        }
                    },

                    {
                        $group: {
                            _id: {
                                plan:
                                    "$subscription.plan",
                                status:
                                    "$subscription.status"
                            },

                            accountCount: {
                                $sum: 1
                            },

                            userCount: {
                                $sum: {
                                    $size:
                                        "$linkedUsers"
                                }
                            }
                        }
                    },

                    {
                        $project: {
                            _id: 0,

                            plan:
                                "$_id.plan",

                            status:
                                "$_id.status",

                            accountCount: 1,
                            userCount: 1
                        }
                    },

                    {
                        $sort: {
                            plan: 1,
                            status: 1
                        }
                    }
                ])
                .toArray();

        console.log();
        console.log(
            "=== ACCOUNT HEALTH SUMMARY ==="
        );
        console.log();

        for (const row of summary) {
            console.log(
                `${row.plan.toUpperCase()} / ${row.status.toUpperCase()}`
            );

            console.log(
                `  Accounts: ${row.accountCount}`
            );

            console.log(
                `  Users: ${row.userCount}`
            );

            console.log();
        }

        const schemaVersions =
            await accounts
                .aggregate<{
                    schemaVersion:
                        number | string;
                    count: number;
                }>([
                    {
                        $group: {
                            _id: "$schemaVersion",
                            count: {
                                $sum: 1
                            }
                        }
                    },

                    {
                        $project: {
                            _id: 0,
                            schemaVersion: "$_id",
                            count: 1
                        }
                    },

                    {
                        $sort: {
                            schemaVersion: 1
                        }
                    }
                ])
                .toArray();

        console.log(
            "=== SCHEMA VERSION SUMMARY ==="
        );
        console.log();

        for (
            const row of schemaVersions
        ) {
            console.log(
                `Schema ${row.schemaVersion}: ${row.count} account(s)`
            );
        }
    } finally {
        await closeDatabaseConnection();
    }
}

accountHealth().catch(
    (error: unknown) => {
        console.error(
            "Account health report failed:",
            error
        );

        process.exit(1);
    }
);