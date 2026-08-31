import {
    MongoClient
} from "mongodb";

import dotenv from "dotenv";

dotenv.config();

const mongoUri =
    process.env.MONGODB_ADMIN_URI;

const databaseName =
    process.env.MONGODB_DATABASE;

if (!mongoUri) {
    throw new Error(
        "MONGODB_ADMIN_URI is not defined."
    );
}

if (!databaseName) {
    throw new Error(
        "MONGODB_DATABASE is not defined."
    );
}

const client =
    new MongoClient(mongoUri);

async function applyValidation(): Promise<void> {
    await client.connect();

    const db =
        client.db(databaseName);

    try {
        await db.command({
            collMod: "users",

            validator: {
                $jsonSchema: {
                    bsonType: "object",

                    required: [
                        "_id",
                        "email",
                        "displayName",
                        "accountId",
                        "status",
                        "createdAt"
                    ],

                    properties: {
                        _id: {
                            bsonType: "objectId"
                        },

                        email: {
                            bsonType: "string",
                            description:
                                "User email must be a string."
                        },

                        displayName: {
                            bsonType: "string"
                        },

                        accountId: {
                            bsonType: "objectId"
                        },

                        status: {
                            enum: [
                                "active",
                                "disabled"
                            ]
                        },

                        createdAt: {
                            bsonType: "date"
                        }
                    }
                }
            },

            validationLevel: "strict",
            validationAction: "error"
        });

        console.log(
            "Applied validation to users."
        );

        await db.command({
            collMod: "accounts",

            validator: {
                $jsonSchema: {
                    bsonType: "object",

                    required: [
                        "_id",
                        "name",
                        "schemaVersion",
                        "subscription",
                        "entitlements",
                        "createdAt",
                        "updatedAt"
                    ],

                    properties: {
                        _id: {
                            bsonType: "objectId"
                        },

                        name: {
                            bsonType: "string"
                        },

                        schemaVersion: {
                            enum: [2]
                        },

                        subscription: {
                            bsonType: "object",

                            required: [
                                "plan",
                                "status"
                            ],

                            properties: {
                                plan: {
                                    enum: [
                                        "free",
                                        "pro",
                                        "enterprise"
                                    ]
                                },

                                status: {
                                    enum: [
                                        "active",
                                        "past_due",
                                        "cancelled"
                                    ]
                                }
                            }
                        },

                        entitlements: {
                            bsonType: "object",

                            required: [
                                "exportCsv",
                                "auditLogs",
                                "apiAccess"
                            ],

                            properties: {
                                exportCsv: {
                                    bsonType: "bool"
                                },

                                auditLogs: {
                                    bsonType: "bool"
                                },

                                apiAccess: {
                                    bsonType: "bool"
                                }
                            }
                        },

                        createdAt: {
                            bsonType: "date"
                        },

                        updatedAt: {
                            bsonType: "date"
                        }
                    }
                }
            },

            validationLevel: "strict",
            validationAction: "error"
        });

        console.log(
            "Applied validation to accounts."
        );
    } finally {
        await client.close();

        console.log(
            "MongoDB admin connection closed."
        );
    }
}

applyValidation().catch(
    (error: unknown) => {
        console.error(
            "Validation setup failed:",
            error
        );

        process.exit(1);
    }
);