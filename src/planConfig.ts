import {
    Entitlements,
    SubscriptionPlan
} from "./types";

export const expectedEntitlements: Record<
    SubscriptionPlan,
    Entitlements
> = {
    free: {
        exportCsv: false,
        auditLogs: false,
        apiAccess: false
    },

    pro: {
        exportCsv: true,
        auditLogs: false,
        apiAccess: true
    },

    enterprise: {
        exportCsv: true,
        auditLogs: true,
        apiAccess: true
    }
};