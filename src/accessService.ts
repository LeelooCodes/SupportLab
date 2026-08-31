import { Db } from "mongodb";

import {
    Account,
    FeatureName,
    User
} from "./types";

export interface AccessResult {
    allowed: boolean;
    reason:
        | "allowed"
        | "user_not_found"
        | "user_disabled"
        | "account_not_found"
        | "subscription_inactive"
        | "entitlement_disabled";
    user?: User;
    account?: Account;
}
export function resolveEntitlement(
    account: Account,
    feature: FeatureName
): boolean {
    return account.entitlements[feature] === true;
}
export async function checkFeatureAccess(
    db: Db,
    email: string,
    feature: FeatureName
): Promise<AccessResult> {
    const users = db.collection<User>("users");
    const accounts = db.collection<Account>("accounts");

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