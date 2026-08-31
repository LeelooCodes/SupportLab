import assert from "node:assert/strict";
import test from "node:test";

import { ObjectId } from "mongodb";

import {
    resolveEntitlement
} from "./accessService";

import {
    Account,
    Entitlements,
    FeatureName
} from "./types";

interface EntitlementFixture {
    name: string;
    entitlements: Entitlements;
}

const features: FeatureName[] = [
    "exportCsv",
    "auditLogs",
    "apiAccess"
];

const fixtures: EntitlementFixture[] = [
    {
        name: "Free-style account",
        entitlements: {
            exportCsv: false,
            auditLogs: false,
            apiAccess: false
        }
    },
    {
        name: "Pro-style account",
        entitlements: {
            exportCsv: true,
            auditLogs: false,
            apiAccess: true
        }
    },
    {
        name: "Enterprise-style account",
        entitlements: {
            exportCsv: true,
            auditLogs: true,
            apiAccess: true
        }
    },
    {
        name: "Audit Logs only",
        entitlements: {
            exportCsv: false,
            auditLogs: true,
            apiAccess: false
        }
    },
    {
        name: "CSV Export only",
        entitlements: {
            exportCsv: true,
            auditLogs: false,
            apiAccess: false
        }
    }
];

function createAccount(
    entitlements: Entitlements
): Account {
    const now = new Date();

    return {
        _id: new ObjectId(),
        name: "Test Account",
        schemaVersion: 2,

        subscription: {
            plan: "pro",
            status: "active"
        },

        entitlements,

        createdAt: now,
        updatedAt: now
    };
}

for (const fixture of fixtures) {
    test(
        `resolves every entitlement correctly: ${fixture.name}`,
        () => {
            const account =
                createAccount(fixture.entitlements);

            for (const feature of features) {
                const expected =
                    fixture.entitlements[feature];

                const actual =
                    resolveEntitlement(
                        account,
                        feature
                    );

                assert.equal(
                    actual,
                    expected,
                    `${feature} resolved incorrectly`
                );
            }
        }
    );
}