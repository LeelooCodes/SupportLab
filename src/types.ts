import { ObjectId } from "mongodb";

export type SubscriptionPlan =
    | "free"
    | "pro"
    | "enterprise";

export type SubscriptionStatus =
    | "active"
    | "past_due"
    | "cancelled";
    
export interface Entitlements {
    exportCsv: boolean;
    auditLogs: boolean;
    apiAccess: boolean;
}

export type FeatureName =
    keyof Entitlements;

export interface Account {
    _id: ObjectId;
    name: string;
    schemaVersion: 2;

    subscription: {
        plan: SubscriptionPlan;
        status: SubscriptionStatus;
    };

    entitlements: Entitlements;

    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    _id: ObjectId;
    email: string;
    displayName: string;
    accountId: ObjectId;
    status: "active" | "disabled";
    createdAt: Date;
}