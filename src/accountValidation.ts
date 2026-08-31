import {
    Document,
    ObjectId
} from "mongodb";

import {
    Account,
    Entitlements,
    SubscriptionPlan,
    SubscriptionStatus
} from "./types";

const subscriptionPlans: SubscriptionPlan[] = [
    "free",
    "pro",
    "enterprise"
];

const subscriptionStatuses: SubscriptionStatus[] = [
    "active",
    "past_due",
    "cancelled"
];

function isSubscriptionPlan(
    value: unknown
): value is SubscriptionPlan {
    return (
        typeof value === "string" &&
        subscriptionPlans.includes(
            value as SubscriptionPlan
        )
    );
}

function isSubscriptionStatus(
    value: unknown
): value is SubscriptionStatus {
    return (
        typeof value === "string" &&
        subscriptionStatuses.includes(
            value as SubscriptionStatus
        )
    );
}

function isEntitlements(
    value: unknown
): value is Entitlements {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const candidate =
        value as Record<string, unknown>;

    return (
        typeof candidate.exportCsv === "boolean" &&
        typeof candidate.auditLogs === "boolean" &&
        typeof candidate.apiAccess === "boolean"
    );
}

export function isCurrentAccount(
    document: Document
): document is Account {
    if (
        document.schemaVersion !== 2 ||
        !(document._id instanceof ObjectId) ||
        typeof document.name !== "string"
    ) {
        return false;
    }

    if (
        typeof document.subscription !== "object" ||
        document.subscription === null
    ) {
        return false;
    }

    const subscription =
        document.subscription as Record<
            string,
            unknown
        >;

    return (
        isSubscriptionPlan(
            subscription.plan
        ) &&
        isSubscriptionStatus(
            subscription.status
        ) &&
        isEntitlements(
            document.entitlements
        ) &&
        document.createdAt instanceof Date &&
        document.updatedAt instanceof Date
    );
}