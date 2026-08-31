import { ObjectId } from "mongodb";

import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";
import {
    normalizeEmail
} from "../src/normalization";
import {
    Account,
    User
} from "../src/types";

async function seed(): Promise<void> {
    const db = await connectToDatabase();

    try {
        const accounts = db.collection<Account>("accounts");
        const users = db.collection<User>("users");

        console.log("Clearing existing SupportLab seed data...");

        await users.deleteMany({});
        await accounts.deleteMany({});

        const freeAccountId = new ObjectId();
        const proAccountId = new ObjectId();
        const enterpriseAccountId = new ObjectId();

        const now = new Date();

        const accountData: Account[] = [
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

        const userData: User[] = [
            {
                _id: new ObjectId(),
                email: normalizeEmail("maya@northstar.example"),
                displayName: "Maya Patel",
                accountId: freeAccountId,
                status: "active",
                createdAt: now
            },
            {
                _id: new ObjectId(),
                email: normalizeEmail(
                    "alex@acme.example"
                ),
                displayName: "Alex Morgan",
                accountId: proAccountId,
                status: "active",
                createdAt: now
            },
            {
                _id: new ObjectId(),
                email: normalizeEmail("sam@acme.example"),
                displayName: "Sam Rivera",
                accountId: proAccountId,
                status: "active",
                createdAt: now
            },
            {
                _id: new ObjectId(),
                email: normalizeEmail("jordan@vertex.example"),
                displayName: "Jordan Lee",
                accountId: enterpriseAccountId,
                status: "active",
                createdAt: now
            },
            {
                _id: new ObjectId(),
                email: normalizeEmail("casey@vertex.example"),
                displayName: "Casey Chen",
                accountId: enterpriseAccountId,
                status: "active",
                createdAt: now
            }
        ];

        const accountResult =
            await accounts.insertMany(accountData);

        const userResult =
            await users.insertMany(userData);

        console.log(
            `Inserted ${accountResult.insertedCount} accounts.`
        );

        console.log(
            `Inserted ${userResult.insertedCount} users.`
        );

        console.log("Healthy seed data created successfully.");
    } finally {
        await closeDatabaseConnection();
    }
}

seed().catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
});