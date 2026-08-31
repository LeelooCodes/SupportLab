"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
async function fixSup101() {
    const db = await (0, db_1.connectToDatabase)();
    try {
        const accounts = db.collection("accounts");
        const account = await accounts.findOne({
            name: "BluePeak Media"
        }, {
            projection: {
                name: 1,
                subscription: 1,
                entitlements: 1
            }
        });
        if (!account) {
            throw new Error("BluePeak Media account was not found.");
        }
        console.log("Current account state:");
        console.log(account);
        if (account.subscription.plan !== "pro" ||
            account.subscription.status !== "active") {
            throw new Error("Account is not an active Pro subscription. Aborting update.");
        }
        if (account.entitlements.exportCsv !== false) {
            throw new Error("CSV Export entitlement is not false. Aborting update.");
        }
        const result = await accounts.updateOne({
            _id: account._id,
            "subscription.plan": "pro",
            "subscription.status": "active",
            "entitlements.exportCsv": false
        }, {
            $set: {
                "entitlements.exportCsv": true,
                updatedAt: new Date()
            }
        });
        console.log(`Matched documents: ${result.matchedCount}`);
        console.log(`Modified documents: ${result.modifiedCount}`);
        if (result.matchedCount !== 1) {
            throw new Error("Expected exactly one matching account. Update was not confirmed.");
        }
        if (result.modifiedCount !== 1) {
            throw new Error("Account matched but was not modified as expected.");
        }
        console.log("SUP-101 data correction completed successfully.");
    }
    finally {
        await (0, db_1.closeDatabaseConnection)();
    }
}
fixSup101().catch((error) => {
    console.error("SUP-101 correction failed:", error);
    process.exit(1);
});
