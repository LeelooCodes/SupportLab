"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.closeDatabaseConnection = closeDatabaseConnection;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;
if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in the environment.");
}
if (!databaseName) {
    throw new Error("MONGODB_DATABASE is not defined in the environment.");
}
const client = new mongodb_1.MongoClient(mongoUri);
async function connectToDatabase() {
    await client.connect();
    console.log("Connected to MongoDB.");
    return client.db(databaseName);
}
async function closeDatabaseConnection() {
    await client.close();
    console.log("MongoDB connection closed.");
}
