import {
    Document,
    ObjectId
} from "mongodb";

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

async function seedIncidents(): Promise<void> {
    const db = await connectToDatabase();

    try {
        const accounts =
            db.collection<Account>("accounts");

        const users =
            db.collection<User>("users");

        /*
         * We deliberately use an untyped collection here.
         *
         * Historical database records may not conform to
         * the application's current TypeScript interface.
         */
        const rawAccounts =
            db.collection<Document>("accounts");

        console.log(
            "Removing previous incident fixtures..."
        );

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

        const bluePeakId = new ObjectId();
        const legacyWorksId = new ObjectId();
        const orbitRetailId = new ObjectId();

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
            _id: new ObjectId(),
            email: normalizeEmail(
                "nina@bluepeak.example"
            ),
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

            createdAt: new Date(
                "2022-04-18T10:30:00Z"
            ),

            updatedAt: new Date(
                "2022-04-18T10:30:00Z"
            )
        });

        await users.insertOne({
            _id: new ObjectId(),
            email: normalizeEmail(
                "robin@legacyworks.example"
            ),
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
                _id: new ObjectId(),
                email: normalizeEmail(
                    "jamie@orbit.example"
                ),
                displayName: "Jamie Brooks",
                accountId: orbitRetailId,
                status: "active",
                createdAt: now
            },
            {
                _id: new ObjectId(),
                // Intentionally bypasses normal email canonicalisation
                // to reproduce the historical SUP-104 data defect.
                email: "Taylor@Orbit.Example",
                displayName: "Taylor Grant",
                accountId: orbitRetailId,
                status: "active",
                createdAt: now
            }
        ]);

        console.log(
            "Incident fixtures created successfully."
        );
    } finally {
        await closeDatabaseConnection();
    }
}

seedIncidents().catch((error: unknown) => {
    console.error(
        "Incident seed failed:",
        error
    );

    process.exit(1);
});