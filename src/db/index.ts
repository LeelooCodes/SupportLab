import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;

if (!mongoUri) {
    throw new Error(
        "MONGODB_URI is not defined in the environment."
    );
}

if (!databaseName) {
    throw new Error(
        "MONGODB_DATABASE is not defined in the environment."
    );
}

const client = new MongoClient(mongoUri);

export async function connectToDatabase(): Promise<Db> {
    await client.connect();

    console.log("Connected to MongoDB.");

    return client.db(databaseName);
}

export async function closeDatabaseConnection(): Promise<void> {
    await client.close();

    console.log("MongoDB connection closed.");
}