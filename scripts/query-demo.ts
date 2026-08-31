import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

import {
    Account,
    User
} from "../src/types";

async function runQueries(): Promise<void> {
    const db = await connectToDatabase();

    try {
        const users = db.collection<User>("users");
        const accounts = db.collection<Account>("accounts");

        const user = await users.findOne({
            email: "alex@acme.example"
        });

        if (!user) {
            throw new Error("User not found.");
        }

        console.log("\nUser found:");
        console.log({
            id: user._id.toHexString(),
            email: user.email,
            accountId: user.accountId.toHexString()
        });

        const account = await accounts.findOne(
            {
                 _id: user.accountId
            },
            {
                projection: {
                    name: 1,
                    subscription: 1,
                    entitlements: 1
                }
            }
        );

        if (!account) {
            throw new Error(
                "Account referenced by user was not found."
            );
        }

        console.log("\nLinked account:");
        console.log(account);

        const activeAccounts = await accounts
            .find(
                {
                    "subscription.status": "active"
                },
                {
                    projection: {
                        name: 1,
                        "subscription.plan": 1
                    }
                }
            )
            .toArray();

        console.log("\nActive accounts:");

        for (const activeAccount of activeAccounts) {
            console.log(activeAccount);
        }
    } finally {
        await closeDatabaseConnection();
    }
}

runQueries().catch((error: unknown) => {
    console.error("Query demo failed:", error);
    process.exit(1);
});