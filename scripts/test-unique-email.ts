import {
    MongoServerError,
    ObjectId
} from "mongodb";

import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

import {
    User
} from "../src/types";

async function testUniqueEmail(): Promise<void> {
    const db =
        await connectToDatabase();

    try {
        const users =
            db.collection<User>("users");

        const existing =
            await users.findOne({
                email:
                    "alex@acme.example"
            });

        if (!existing) {
            throw new Error(
                "Expected Alex fixture was not found."
            );
        }

        try {
            await users.insertOne({
                _id: new ObjectId(),

                email:
                    "alex@acme.example",

                displayName:
                    "Duplicate Alex",

                accountId:
                    existing.accountId,

                status:
                    "active",

                createdAt:
                    new Date()
            });

            throw new Error(
                "Duplicate email was unexpectedly accepted."
            );
        } catch (error: unknown) {
            if (
                error instanceof MongoServerError &&
                error.code === 11000
            ) {
                console.log(
                    "PASS: unique email index rejected duplicate user."
                );

                return;
            }

            throw error;
        }
    } finally {
        await closeDatabaseConnection();
    }
}

testUniqueEmail().catch(
    (error: unknown) => {
        console.error(
            "Unique-index test failed:",
            error
        );

        process.exit(1);
    }
);