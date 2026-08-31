import {
    Document
} from "mongodb";

import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

interface DuplicateEmailGroup {
    canonicalEmail: string;
    count: number;

    users: Array<{
        id: unknown;
        email: string;
    }>;
}

async function auditUserEmails(): Promise<void> {
    const db =
        await connectToDatabase();

    try {
        const users =
            db.collection<Document>("users");

        const nonCanonicalUsers =
            await users
                .find({
                    email: {
                        $regex: /[A-Z]/
                    }
                })
                .project({
                    email: 1,
                    displayName: 1
                })
                .toArray();

        console.log(
            "=== NON-CANONICAL EMAILS ==="
        );

        if (
            nonCanonicalUsers.length === 0
        ) {
            console.log(
                "None detected."
            );
        } else {
            for (
                const user of nonCanonicalUsers
            ) {
                console.log(
                    `${user.email}`
                );
            }
        }

        const duplicateGroups =
            await users
                .aggregate<DuplicateEmailGroup>([
                    {
                        $group: {
                            _id: {
                                $toLower:
                                    "$email"
                            },

                            count: {
                                $sum: 1
                            },

                            users: {
                                $push: {
                                    id: "$_id",
                                    email: "$email"
                                }
                            }
                        }
                    },

                    {
                        $match: {
                            count: {
                                $gt: 1
                            }
                        }
                    },

                    {
                        $project: {
                            _id: 0,

                            canonicalEmail:
                                "$_id",

                            count: 1,
                            users: 1
                        }
                    }
                ])
                .toArray();

        console.log();
        console.log(
            "=== LOGICAL EMAIL COLLISIONS ==="
        );

        if (
            duplicateGroups.length === 0
        ) {
            console.log(
                "None detected."
            );
        } else {
            for (
                const group of duplicateGroups
            ) {
                console.log(
                    `${group.canonicalEmail}: ${group.count} records`
                );

                console.log(
                    group.users
                );
            }
        }

        console.log();

        if (
            nonCanonicalUsers.length === 0 &&
            duplicateGroups.length === 0
        ) {
            console.log(
                "Email data is safe for canonical unique indexing."
            );
        } else {
            console.log(
                "Resolve email-data issues before creating the unique index."
            );
        }
    } finally {
        await closeDatabaseConnection();
    }
}

auditUserEmails().catch(
    (error: unknown) => {
        console.error(
            "Email audit failed:",
            error
        );

        process.exit(1);
    }
);