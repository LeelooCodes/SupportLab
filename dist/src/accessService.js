"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFeatureAccess = checkFeatureAccess;
function resolveEntitlement(account, feature) {
    const { exportCsv, auditLogs, apiAccess } = account.entitlements;
    const entitlementMap = {
        exportCsv,
        auditLogs: apiAccess,
        apiAccess
    };
    return entitlementMap[feature];
}
async function checkFeatureAccess(db, email, feature) {
    const users = db.collection("users");
    const accounts = db.collection("accounts");
    const user = await users.findOne({
        email
    });
    if (!user) {
        return {
            allowed: false,
            reason: "user_not_found"
        };
    }
    if (user.status !== "active") {
        return {
            allowed: false,
            reason: "user_disabled",
            user
        };
    }
    const account = await accounts.findOne({
        _id: user.accountId
    });
    if (!account) {
        return {
            allowed: false,
            reason: "account_not_found",
            user
        };
    }
    if (account.subscription.status !== "active") {
        return {
            allowed: false,
            reason: "subscription_inactive",
            user,
            account
        };
    }
    if (!resolveEntitlement(account, feature)) {
        return {
            allowed: false,
            reason: "entitlement_disabled",
            user,
            account
        };
    }
    return {
        allowed: true,
        reason: "allowed",
        user,
        account
    };
}
