"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const db_1 = require("../src/db");
async function seedIncidents() {
    const db = await (0, db_1.connectToDatabase)();
    try {
        const accounts = db.collection("accounts");
        const users = db.collection("users");
        /*
         * We deliberately use an untyped collection here.
         *
         * Historical database records may not conform to
         * the application's current TypeScript interface.
         */
        const rawAccounts = db.collection("accounts");
        console.log("Removing previous incident fixtures...");
        await users.deleteMany({
            email: {
                $in: [
                    "nina@bluepeak.example",
                    "robin@legacyworks.example",
                    "jamie@orbit.example",
                    "Taylor@Orbit.Example"
                ]
            }
        });
        await rawAccounts.deleteMany({
            name: {
                $in: [
                    "BluePeak Media",
                    "LegacyWorks Ltd",
                    "Orbit Retail"
                ]
            }
        });
        const now = new Date();
        const bluePeakId = new mongodb_1.ObjectId();
        const legacyWorksId = new mongodb_1.ObjectId();
        const orbitRetailId = new mongodb_1.ObjectId();
        await accounts.insertOne({
            _id: bluePeakId,
            name: "BluePeak Media",
            schemaVersion: 2,
            subscription: {
                plan: "pro",
                status: "active"
            },
            entitlements: {
                exportCsv: false,
                auditLogs: false,
                apiAccess: true
            },
            createdAt: now,
            updatedAt: now
        });
        await users.insertOne({
            _id: new mongodb_1.ObjectId(),
            email: "nina@bluepeak.example",
            displayName: "Nina Foster",
            accountId: bluePeakId,
            status: "active",
            createdAt: now
        });
        await rawAccounts.insertOne({
            _id: legacyWorksId,
            name: "LegacyWorks Ltd",
            schemaVersion: 1,
            plan: "pro",
            active: true,
            features: [
                "exportCsv",
                "apiAccess"
            ],
            createdAt: new Date("2022-04-18T10:30:00Z"),
            updatedAt: new Date("2022-04-18T10:30:00Z")
        });
        await users.insertOne({
            _id: new mongodb_1.ObjectId(),
            email: "robin@legacyworks.example",
            displayName: "Robin Shaw",
            accountId: legacyWorksId,
            status: "active",
            createdAt: now
        });
        await accounts.insertOne({
            _id: orbitRetailId,
            name: "Orbit Retail",
            schemaVersion: 2,
            subscription: {
                plan: "pro",
                status: "active"
            },
            entitlements: {
                exportCsv: true,
                auditLogs: false,
                apiAccess: true
            },
            createdAt: now,
            updatedAt: now
        });
        await users.insertMany([
            {
                _id: new mongodb_1.ObjectId(),
                email: "jamie@orbit.example",
                displayName: "Jamie Brooks",
                accountId: orbitRetailId,
                status: "active",
                createdAt: now
            },
            {
                _id: new mongodb_1.ObjectId(),
                email: "Taylor@Orbit.Example",
                displayName: "Taylor Grant",
                accountId: orbitRetailId,
                status: "active",
                createdAt: now
            }
        ]);
        console.log("Incident fixtures created successfully.");
    }
    finally {
        await (0, db_1.closeDatabaseConnection)();
    }
}
seedIncidents().catch((error) => {
    console.error("Incident seed failed:", error);
    process.exit(1);
});
