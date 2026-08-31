import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

import {
    Account,
    User
} from "../src/types";

async function createIndexes(): Promise<void> {
    const db =
        await connectToDatabase();

    try {
        const users =
            db.collection<User>("users");

        const accounts =
            db.collection<Account>(
                "accounts"
            );

        const emailIndex =
            await users.createIndex(
                {
                    email: 1
                },
                {
                    unique: true,
                    name: "ux_users_email"
                }
            );

        console.log(
            `Created/verified index: ${emailIndex}`
        );

        const accountIdIndex =
            await users.createIndex(
                {
                    accountId: 1
                },
                {
                    name:
                        "ix_users_accountId"
                }
            );

        console.log(
            `Created/verified index: ${accountIdIndex}`
        );

        const schemaVersionIndex =
            await accounts.createIndex(
                {
                    schemaVersion: 1
                },
                {
                    name:
                        "ix_accounts_schemaVersion"
                }
            );

        console.log(
            `Created/verified index: ${schemaVersionIndex}`
        );

        console.log();
        console.log("User indexes:");

        console.log(
            await users.indexes()
        );

        console.log();
        console.log("Account indexes:");

        console.log(
            await accounts.indexes()
        );
    } finally {
        await closeDatabaseConnection();
    }
}

createIndexes().catch(
    (error: unknown) => {
        console.error(
            "Index creation failed:",
            error
        );

        process.exit(1);
    }
);