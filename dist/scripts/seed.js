"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const db_1 = require("../src/db");
async function seed() {
    const db = await (0, db_1.connectToDatabase)();
    try {
        const accounts = db.collection("accounts");
        const users = db.collection("users");
        console.log("Clearing existing SupportLab seed data...");
        await users.deleteMany({});
        await accounts.deleteMany({});
        const freeAccountId = new mongodb_1.ObjectId();
        const proAccountId = new mongodb_1.ObjectId();
        const enterpriseAccountId = new mongodb_1.ObjectId();
        const now = new Date();
        const accountData = [
            {
                _id: freeAccountId,
                name: "Northstar Design",
                schemaVersion: 2,
                subscription: {
                    plan: "free",
                    status: "active"
                },
                entitlements: {
                    exportCsv: false,
                    auditLogs: false,
                    apiAccess: false
                },
                createdAt: now,
                updatedAt: now
            },
            {
                _id: proAccountId,
                name: "Acme Analytics",
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
            },
            {
                _id: enterpriseAccountId,
                name: "Vertex Systems",
                schemaVersion: 2,
                subscription: {
                    plan: "enterprise",
                    status: "active"
                },
                entitlements: {
                    exportCsv: true,
                    auditLogs: true,
                    apiAccess: true
                },
                createdAt: now,
                updatedAt: now
            }
        ];
        const userData = [
            {
                _id: new mongodb_1.ObjectId(),
                email: "maya@northstar.example",
                displayName: "Maya Patel",
                accountId: freeAccountId,
                status: "active",
                createdAt: now
            },
            {
                _id: new mongodb_1.ObjectId(),
                email: "alex@acme.example",
                displayName: "Alex Morgan",
                accountId: proAccountId,
                status: "active",
                createdAt: now
            },
            {
                _id: new mongodb_1.ObjectId(),
                email: "sam@acme.example",
                displayName: "Sam Rivera",
                accountId: proAccountId,
                status: "active",
                createdAt: now
            },
            {
                _id: new mongodb_1.ObjectId(),
                email: "jordan@vertex.example",
                displayName: "Jordan Lee",
                accountId: enterpriseAccountId,
                status: "active",
                createdAt: now
            },
            {
                _id: new mongodb_1.ObjectId(),
                email: "casey@vertex.example",
                displayName: "Casey Chen",
                accountId: enterpriseAccountId,
                status: "active",
                createdAt: now
            }
        ];
        const accountResult = await accounts.insertMany(accountData);
        const userResult = await users.insertMany(userData);
        console.log(`Inserted ${accountResult.insertedCount} accounts.`);
        console.log(`Inserted ${userResult.insertedCount} users.`);
        console.log("Healthy seed data created successfully.");
    }
    finally {
        await (0, db_1.closeDatabaseConnection)();
    }
}
seed().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
});
