import {
    Document,
    MongoServerError,
    ObjectId
} from "mongodb";

import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

async function testValidation(): Promise<void> {
    const db =
        await connectToDatabase();

    try {
        const users =
            db.collection<Document>("users");

        const accounts =
            db.collection<Document>("accounts");

        console.log(
            "Testing invalid user insert..."
        );

        try {
            await users.insertOne({
                _id: new ObjectId(),

                email:
                    "invalid@example.com",

                displayName:
                    "Invalid Test User",

                /*
                 * Deliberately wrong.
                 */
                status:
                    "awaiting_approval",

                createdAt:
                    new Date()
            });

            throw new Error(
                "Invalid user was unexpectedly accepted."
            );
        } catch (error: unknown) {
            if (
                error instanceof MongoServerError &&
                error.code === 121
            ) {
                console.log(
                    "PASS: MongoDB rejected invalid user data."
                );
            } else {
                throw error;
            }
        }

        console.log(
            "Testing invalid account insert..."
        );

        try {
            await accounts.insertOne({
                _id: new ObjectId(),

                name:
                    "Invalid Account Fixture",

                /*
                 * Deliberately obsolete.
                 */
                schemaVersion: 1,

                plan: "pro",
                active: true,
                features: [
                    "exportCsv"
                ],

                createdAt:
                    new Date(),

                updatedAt:
                    new Date()
            });

            throw new Error(
                "Invalid account was unexpectedly accepted."
            );
        } catch (error: unknown) {
            if (
                error instanceof MongoServerError &&
                error.code === 121
            ) {
                console.log(
                    "PASS: MongoDB rejected invalid account data."
                );
            } else {
                throw error;
            }
        }

        console.log();
        console.log(
            "Database validation tests passed."
        );
    } finally {
        await closeDatabaseConnection();
    }
}

testValidation().catch(
    (error: unknown) => {
        console.error(
            "Database validation test failed:",
            error
        );

        process.exit(1);
    }
);