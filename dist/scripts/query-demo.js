"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
async function runQueries() {
    const db = await (0, db_1.connectToDatabase)();
    try {
        const users = db.collection("users");
        const accounts = db.collection("accounts");
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
        const account = await accounts.findOne({
            _id: user.accountId
        }, {
            projection: {
                name: 1,
                subscription: 1,
                entitlements: 1
            }
        });
        if (!account) {
            throw new Error("Account referenced by user was not found.");
        }
        console.log("\nLinked account:");
        console.log(account);
        const activeAccounts = await accounts
            .find({
            "subscription.status": "active"
        }, {
            projection: {
                name: 1,
                "subscription.plan": 1
            }
        })
            .toArray();
        console.log("\nActive accounts:");
        for (const activeAccount of activeAccounts) {
            console.log(activeAccount);
        }
    }
    finally {
        await (0, db_1.closeDatabaseConnection)();
    }
}
runQueries().catch((error) => {
    console.error("Query demo failed:", error);
    process.exit(1);
});
