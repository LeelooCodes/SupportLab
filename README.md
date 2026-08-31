# SupportLab

**A TypeScript + MongoDB Product Support Engineering lab for incident investigation, diagnostic scripting, data troubleshooting, application debugging, and schema migration.**

SupportLab is a deliberately small SaaS-style backend designed to simulate the technical work performed by a Product Support Engineer.

Rather than focusing on frontend development or building a large application, the project focuses on the investigation lifecycle behind difficult customer issues:

```text
User reports issue
        ↓
Reproduce behaviour
        ↓
Inspect structured logs
        ↓
Trace TypeScript application flow
        ↓
Query MongoDB
        ↓
Compare healthy and affected data
        ↓
Identify root cause
        ↓
Apply a guarded correction or migration
        ↓
Validate the fix
        ↓
Regression test
        ↓
Document RCA and preventative action
```

The project contains deliberately seeded support incidents involving inconsistent customer data, a TypeScript application defect, a legacy MongoDB schema, and a user-specific data edge case.

All users, organisations, incidents, and data in this repository are fictional and exist solely for learning and portfolio purposes.

---

## What This Project Demonstrates

SupportLab provides hands-on experience with:

### TypeScript / Node.js

- TypeScript
- Node.js
- Express
- `async` / `await`
- interfaces and type definitions
- union types
- `keyof`
- type guards
- runtime validation
- indexed object access
- structured error handling
- application-flow tracing
- Node.js test runner
- table-driven regression testing

### MongoDB

- MongoDB Atlas
- MongoDB Compass
- MongoDB Node.js Driver
- documents and collections
- ObjectIds
- `find()`
- `findOne()`
- `insertOne()`
- `insertMany()`
- `updateOne()`
- `deleteMany()`
- filters
- projections
- nested-field queries
- `$set`
- `$unset`
- aggregation pipelines
- `$match`
- `$lookup`
- `$group`
- `$project`
- `$sort`
- `$toLower`
- schema validation
- unique indexes
- operational/query indexes
- duplicate detection
- runtime data validation

### Product Support Engineering

- incident reproduction
- application troubleshooting
- backend troubleshooting
- database troubleshooting
- structured log analysis
- request correlation
- diagnostic scripting
- root-cause analysis
- production-style data investigation
- affected-vs-healthy record comparison
- application debugging
- edge-case investigation
- "works for most users but not this user" troubleshooting
- guarded data remediation
- fix validation
- regression validation
- systemic improvement identification
- technical incident documentation

### Data Migration

- legacy-schema detection
- schema versioning
- V1 → V2 data transformation
- migration scripting
- dry-run migrations
- guarded updates
- migration logging
- invalid-record handling
- post-migration validation
- idempotent migration behaviour

---

# Technology Stack

| Technology | Purpose |
| --- | --- |
| TypeScript | Application, diagnostics, migrations and support tooling |
| Node.js | Runtime |
| Express | Small SaaS-style HTTP API |
| MongoDB Atlas | Cloud-hosted document database |
| MongoDB Compass | Manual database investigation |
| MongoDB Node.js Driver | Direct MongoDB access |
| Pino | Structured JSON application logging |
| dotenv | Environment configuration |
| tsx | TypeScript execution during development |
| Node Test Runner | Regression testing |
| Git / GitHub | Version control and incident history |

The project deliberately uses the official MongoDB Node.js driver rather than an ORM so that MongoDB queries, filters, projections, ObjectIds, updates, aggregations, and validation remain visible in the application code.

---

# Product Model

SupportLab simulates a small subscription SaaS product.

Users belong to customer accounts, and accounts contain subscription and entitlement information that determines which product features are available.

The database contains two primary collections:

```text
supportlab
├── users
└── accounts
```

---

## Users

A current user document resembles:

```text
User
├── _id
├── email
├── displayName
├── accountId
├── status
└── createdAt
```

Example:

```json
{
  "_id": "ObjectId(...)",
  "email": "alex@acme.example",
  "displayName": "Alex Morgan",
  "accountId": "ObjectId(...)",
  "status": "active",
  "createdAt": "..."
}
```

`accountId` references the `_id` of a document in the `accounts` collection.

---

## Accounts

The current account format is **schema version 2**:

```text
Account
├── _id
├── name
├── schemaVersion
├── subscription
│   ├── plan
│   └── status
├── entitlements
│   ├── exportCsv
│   ├── auditLogs
│   └── apiAccess
├── createdAt
└── updatedAt
```

Example:

```json
{
  "_id": "ObjectId(...)",
  "name": "Acme Analytics",
  "schemaVersion": 2,
  "subscription": {
    "plan": "pro",
    "status": "active"
  },
  "entitlements": {
    "exportCsv": true,
    "auditLogs": false,
    "apiAccess": true
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# Feature Model

The SaaS product contains three simulated features:

| Plan | CSV Export | Audit Logs | API Access |
| --- | :---: | :---: | :---: |
| Free | ❌ | ❌ | ❌ |
| Pro | ✅ | ❌ | ✅ |
| Enterprise | ✅ | ✅ | ✅ |

Feature access is determined using the account's persisted subscription and entitlement state.

---

# Architecture

```text
                       ┌──────────────────────┐
                       │  Client / Support    │
                       │      Engineer        │
                       └──────────┬───────────┘
                                  │
                                  │ HTTP
                                  ▼
                       ┌──────────────────────┐
                       │     Express API      │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ TypeScript Services  │
                       └───────┬───────┬──────┘
                               │       │
                    MongoDB    │       │ Structured
                    queries    │       │ logging
                               ▼       ▼
                    ┌──────────────┐  ┌──────────────┐
                    │ MongoDB Atlas│  │     Pino     │
                    │              │  │  JSON Logs   │
                    │ users        │  └──────────────┘
                    │ accounts     │
                    └──────────────┘
                           ▲
                           │
                    manual investigation
                           │
                    ┌──────────────┐
                    │   Compass    │
                    └──────────────┘
```

Support investigations can therefore compare:

```text
Application behaviour
        vs.
Structured logs
        vs.
MongoDB state
        vs.
TypeScript implementation
```

---

# API

The application exposes a deliberately small HTTP API.

### Health check

```http
GET /health
```

### User lookup

```http
GET /users/:email
```

### Feature access

```http
GET /users/:email/features/:feature
```

Example:

```text
GET /users/alex@acme.example/features/exportCsv
```

Successful response:

```json
{
  "allowed": true,
  "feature": "exportCsv",
  "reason": "allowed"
}
```

A legitimate entitlement denial may return:

```json
{
  "allowed": false,
  "feature": "auditLogs",
  "reason": "entitlement_disabled"
}
```

---

# Structured Logging

SupportLab uses Pino to write structured JSON application logs.

Examples of logged events include:

```text
request_received

user_lookup_succeeded
user_lookup_failed
user_lookup_error

feature_access_allowed
feature_access_denied
feature_access_error

migration_record_completed
migration_record_invalid
migration_validation_failed
migration_completed

user_email_normalized
email_normalization_conflict

diagnostic_user_completed
diagnostic_user_not_found
```

Every HTTP request is assigned a generated `requestId`.

This allows events associated with a single request to be correlated during investigation.

Example:

```json
{
  "level": 40,
  "event": "feature_access_denied",
  "requestId": "84e9698d-c550-43d1-9230-58b20fb55872",
  "email": "maya@northstar.example",
  "feature": "exportCsv",
  "plan": "free",
  "reason": "entitlement_disabled"
}
```

Runtime logs are stored under:

```text
logs/app.log
```

and are deliberately excluded from source control.

---

# Simulated Support Incidents

Four incidents were created to exercise different Product Support Engineering investigation paths.

---

## SUP-101 — Incorrect MongoDB Account Data

### Report

An active Pro customer reported that CSV Export was unavailable.

Affected user:

```text
nina@bluepeak.example
```

### Investigation

The issue was reproduced through the feature-access API.

The user record was present and active.

Structured logs reported:

```text
feature: exportCsv
plan: pro
reason: entitlement_disabled
```

The affected user's `accountId` was used to locate the corresponding account in MongoDB.

BluePeak Media stored:

```text
subscription.plan = pro
subscription.status = active
entitlements.exportCsv = false
```

A healthy Pro account stored:

```text
entitlements.exportCsv = true
```

### Root Cause

The customer-facing behaviour was caused by inconsistent account data.

The account was correctly configured as an active Pro subscription, but its CSV Export entitlement was incorrectly stored as disabled.

The application correctly interpreted the data it received.

### Resolution

A guarded TypeScript remediation script used MongoDB `updateOne()` to correct the affected entitlement.

The operation required the account to still match the state established during investigation before modification was permitted.

The script checked:

```text
matchedCount
modifiedCount
```

and revalidated the resulting customer behaviour.

### Systemic Improvement

The incident motivated automated account-health diagnostics capable of detecting entitlement configurations inconsistent with their subscription plan.

Full investigation:

[`incidents/SUP-101.md`](incidents/SUP-101.md)

---

## SUP-102 — TypeScript Entitlement Resolution Defect

### Report

A Pro customer was incorrectly able to access Audit Logs despite the feature being disabled in MongoDB.

Affected user:

```text
alex@acme.example
```

### Investigation

MongoDB stored:

```text
auditLogs = false
apiAccess = true
```

but the API returned:

```text
Audit Logs → allowed
```

The request path was traced through:

```text
Express route
    ↓
checkFeatureAccess()
    ↓
resolveEntitlement()
```

The database was correct.

The TypeScript entitlement resolver contained an intermediate mapping in which:

```text
auditLogs
```

was accidentally associated with:

```text
apiAccess
```

The defect therefore remained type-correct because both values were booleans.

### Root Cause

The application was evaluating the wrong boolean property.

The stored `auditLogs` value was never consulted for Audit Logs requests.

### Resolution

The unnecessary intermediate mapping was removed.

The resolver now indexes the stored entitlement directly:

```ts
account.entitlements[feature] === true
```

`FeatureName` was also derived from:

```ts
keyof Entitlements
```

to avoid maintaining a separate duplicate list of entitlement property names.

### Regression Testing

A table-driven regression test checks all supported features across multiple entitlement configurations.

The test deliberately includes cases where:

```text
auditLogs != apiAccess
```

because identical boolean values would not reveal a transposition between the fields.

The regression test was confirmed to fail against the defective implementation and pass after the correction.

Full investigation:

[`incidents/SUP-102.md`](incidents/SUP-102.md)

---

## SUP-103 — Legacy MongoDB Schema Migration

### Report

A returning customer could be found successfully, but feature-access requests generated an internal server error.

Affected user:

```text
robin@legacyworks.example
```

### Investigation

The user lookup succeeded.

The linked account existed, but MongoDB contained an older persisted schema.

Legacy account:

```text
Schema V1
├── plan
├── active
└── features[]
```

Current application expectation:

```text
Schema V2
├── subscription
│   ├── plan
│   └── status
└── entitlements
    ├── exportCsv
    ├── auditLogs
    └── apiAccess
```

The application attempted to access:

```ts
account.subscription.status
```

but the V1 document did not contain a `subscription` object.

### Root Cause

A historical MongoDB document had never been migrated to the structure expected by the current application.

The incident also demonstrates an important distinction:

> TypeScript interfaces describe what application code expects, but they do not validate the runtime shape of historical MongoDB records.

### Resolution

A TypeScript V1 → V2 migration utility was implemented.

The migration:

- queries only `schemaVersion: 1` records;
- validates legacy documents at runtime;
- transforms V1 data into V2 structures;
- maps legacy feature arrays to explicit entitlements;
- performs guarded `updateOne()` operations;
- uses `$set` and `$unset`;
- removes obsolete legacy fields;
- updates timestamps;
- validates `matchedCount` and `modifiedCount`;
- re-reads migrated documents;
- logs migration results;
- skips malformed records safely;
- supports dry-run execution.

### Migration Validation

The migration was first run in dry-run mode.

The live migration then converted LegacyWorks Ltd to schema version 2.

The migration was executed a second time and found zero eligible records, demonstrating safe repeated execution for already-migrated documents.

A deliberately malformed V1 fixture was also tested and correctly logged/skipped without being modified.

Full investigation:

[`incidents/SUP-103.md`](incidents/SUP-103.md)

---

## SUP-104 — User-Specific Email Normalisation Edge Case

### Report

One Orbit Retail employee could not be found even though another employee on the same account worked normally.

Affected user:

```text
taylor@orbit.example
```

Working colleague:

```text
jamie@orbit.example
```

### Investigation

The Orbit Retail account was healthy.

Jamie was stored as:

```text
jamie@orbit.example
```

Taylor was stored as:

```text
Taylor@Orbit.Example
```

Incoming API requests were normalised to lower case before querying:

```text
Taylor@Orbit.Example
        ↓
taylor@orbit.example
```

MongoDB exact string equality is case-sensitive by default.

The application therefore searched for:

```text
taylor@orbit.example
```

while the database stored:

```text
Taylor@Orbit.Example
```

and returned no match.

### Root Cause

Email canonicalisation was applied during reads but not consistently during writes.

The application's lookup behaviour therefore assumed a canonical representation that the persisted data did not enforce.

The investigation also identified a related integrity risk: without a unique canonical email constraint, case variants of the same logical address could coexist as separate documents.

### Resolution

Email canonicalisation was centralised in:

```ts
normalizeEmail()
```

which:

- trims surrounding whitespace;
- converts addresses to lower case.

Normal write paths use the same canonicalisation function.

A reusable TypeScript cleanup utility was also created for historical data.

The utility:

- identifies non-canonical email values;
- supports dry-run execution;
- checks for collisions before changing data;
- skips conflicting records rather than guessing;
- uses guarded MongoDB updates;
- re-reads updated records for validation;
- logs remediation activity.

### Validation

After remediation:

```text
taylor@orbit.example
Taylor@Orbit.Example
TAYLOR@ORBIT.EXAMPLE
```

all successfully resolve to the same canonical user.

Full investigation:

[`incidents/SUP-104.md`](incidents/SUP-104.md)

---

# Diagnostic CLI

SupportLab contains a reusable TypeScript support diagnostic.

Run:

```bash
npm run diagnose -- alex@acme.example
```

Example output:

```text
=== SUPPORTLAB USER DIAGNOSTIC ===

User
  Name: Alex Morgan
  Email: alex@acme.example
  Status: active
  User ID: ...
  Account ID: ...

Account
  Name: Acme Analytics
  Schema Version: 2
  Plan: pro
  Subscription Status: active

Entitlements
  CSV Export: enabled
  Audit Logs: disabled
  API Access: enabled

Checks
  [PASS] User email is canonical.
  [PASS] Account uses current schema V2.
  [PASS] Account subscription is active.
  [PASS] exportCsv matches expected pro configuration.
  [PASS] auditLogs matches expected pro configuration.
  [PASS] apiAccess matches expected pro configuration.

Result
  No obvious account-health issues detected.
```

The diagnostic performs:

```text
email
  ↓
user lookup
  ↓
account ObjectId
  ↓
account lookup
  ↓
schema validation
  ↓
subscription validation
  ↓
entitlement comparison
  ↓
canonical-email check
```

The tool deliberately reports suspicious state rather than automatically modifying customer data.

This keeps diagnosis and remediation as separate operations.

---

# Account Health Aggregation

Run:

```bash
npm run health
```

The health report uses MongoDB aggregation to provide an overview of account state.

The aggregation exercises:

```text
$match
$lookup
$group
$project
$sort
```

It joins:

```text
accounts._id
```

with:

```text
users.accountId
```

and reports account and user counts grouped by subscription plan and status.

It also reports the distribution of:

```text
schemaVersion
```

across account documents.

This provides a dataset-level check for remaining legacy records.

---

# MongoDB Queries

The project directly exercises the MongoDB Node.js Driver.

Example user lookup:

```ts
const user = await users.findOne({
    email: "alex@acme.example"
});
```

Example nested-field filter:

```ts
accounts.find({
    "subscription.status": "active"
});
```

Example projection:

```ts
{
    projection: {
        name: 1,
        subscription: 1,
        entitlements: 1
    }
}
```

Example guarded update:

```ts
await accounts.updateOne(
    {
        _id: account._id,
        "subscription.plan": "pro",
        "subscription.status": "active",
        "entitlements.exportCsv": false
    },
    {
        $set: {
            "entitlements.exportCsv": true,
            updatedAt: new Date()
        }
    }
);
```

---

# Data Migration

Preview the V1 → V2 migration without modifying MongoDB:

```bash
npm run migrate:v1-v2:dry
```

Execute the migration:

```bash
npm run migrate:v1-v2
```

Migration flow:

```text
Find schemaVersion 1 records
            ↓
Runtime validation
            ↓
Transform V1 → V2
            ↓
Guarded updateOne()
            ↓
$set current fields
            ↓
$unset legacy fields
            ↓
Check write result
            ↓
Re-read document
            ↓
Post-migration validation
            ↓
Structured migration log
```

Invalid records are logged and skipped rather than being transformed without sufficient evidence.

---

# Email Data Remediation

Audit the user collection:

```bash
npm run db:audit-emails
```

Preview email normalisation:

```bash
npm run normalize:emails:dry
```

Apply normalisation:

```bash
npm run normalize:emails
```

Before changing an email address, the utility checks whether another document already owns the target canonical address.

A potential collision results in:

```text
log
→ skip
→ manual investigation
```

rather than an automatic merge or overwrite.

---

# MongoDB Aggregation

SupportLab uses aggregation pipelines both for support diagnostics and data-integrity investigation.

Examples include:

```text
$match
```

to restrict records,

```text
$lookup
```

to associate accounts with users,

```text
$group
```

to calculate summary statistics,

```text
$project
```

to reshape results,

and:

```text
$toLower
```

to detect logical duplicate email identities.

Aggregations were also exercised directly through MongoDB Compass.

---

# MongoDB Collection Validation

The hardened database uses collection-level `$jsonSchema` validation.

Apply the validators with:

```bash
npm run db:validation
```

The validators enforce fields including:

### Users

- `_id` must be an ObjectId;
- `email` must be a string;
- `displayName` must be a string;
- `accountId` must be an ObjectId;
- `status` must be `active` or `disabled`;
- `createdAt` must be a date.

### Accounts

- `_id` must be an ObjectId;
- `schemaVersion` must be `2`;
- subscription plan must be recognised;
- subscription status must be recognised;
- all entitlement values must be booleans;
- timestamps must be valid dates.

Validation is configured with:

```text
validationLevel: strict
validationAction: error
```

---

# Testing Database Validation

Run:

```bash
npm run db:test-validation
```

The script deliberately bypasses TypeScript's application models and attempts malformed MongoDB inserts.

This proves that database validation remains effective even if application-level typing is bypassed.

The project exercises MongoDB document-validation error:

```text
121
```

---

# MongoDB Indexing

SupportLab creates indexes aligned with common support queries and data-integrity requirements.

### Users

```text
ux_users_email
{ email: 1 }
UNIQUE
```

Purpose:

- supports exact email lookups;
- prevents duplicate canonical user identities.

```text
ix_users_accountId
{ accountId: 1 }
```

Purpose:

- supports investigations that locate all users belonging to an account;
- supports account/user lookup operations.

### Accounts

```text
ix_accounts_schemaVersion
{ schemaVersion: 1 }
```

Purpose:

- supports migration discovery;
- supports schema-health reporting.

Create or verify indexes:

```bash
npm run db:indexes
```

Existing email data is audited before the unique email index is introduced.

---

# Testing the Unique Email Constraint

Run:

```bash
npm run db:test-unique-email
```

The test attempts to insert another document using an existing canonical email address.

MongoDB rejects it with duplicate-key error:

```text
11000
```

This demonstrates database-level enforcement rather than relying solely on application logic.

---

# Runtime Data Validation

The project deliberately distinguishes between:

```text
TypeScript static typing
```

and:

```text
runtime data validation
```

A TypeScript declaration such as:

```ts
db.collection<Account>("accounts")
```

does not prove that historical MongoDB data actually conforms to `Account`.

Runtime validators are therefore used when data crosses important trust boundaries.

This distinction was directly demonstrated by SUP-103.

---

# Testing

Run all TypeScript regression tests:

```bash
npm test
```

The current suite covers:

- entitlement resolution;
- mixed entitlement combinations;
- email canonicalisation;
- mixed-case email input;
- upper-case email input;
- already canonical email addresses;
- whitespace normalisation.

Compile the project:

```bash
npm run build
```

Database-level checks include:

```bash
npm run db:test-validation
npm run db:test-unique-email
npm run db:audit-emails
```

---

# Project Structure

```text
SupportLab/
│
├── incidents/
│   ├── SUP-101.md
│   ├── SUP-102.md
│   ├── SUP-103.md
│   └── SUP-104.md
│
├── logs/
│   └── .gitkeep
│
├── scripts/
│   ├── account-health.ts
│   ├── apply-validation.ts
│   ├── audit-user-emails.ts
│   ├── create-indexes.ts
│   ├── diagnose.ts
│   ├── fix-sup101.ts
│   ├── migrate-v1-to-v2.ts
│   ├── normalize-user-emails.ts
│   ├── query-demo.ts
│   ├── seed-incidents.ts
│   ├── seed.ts
│   ├── test-database-validation.ts
│   └── test-unique-email.ts
│
├── src/
│   ├── accessService.test.ts
│   ├── accessService.ts
│   ├── accountValidation.ts
│   ├── app.ts
│   ├── db.ts
│   ├── logger.ts
│   ├── normalization.test.ts
│   ├── normalization.ts
│   ├── planConfig.ts
│   └── types.ts
│
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
├── tsconfig.json
└── README.md
```

---

# Getting Started

## Prerequisites

You will need:

- Node.js
- npm
- Git
- a MongoDB Atlas deployment
- MongoDB Compass is recommended for manual investigation

---

## Clone the Repository

```bash
git clone https://github.com/LeelooCodes/SupportLab.git
cd SupportLab
```

Install dependencies:

```bash
npm install
```

---

# Environment Configuration

Create:

```text
.env
```

based on:

```text
.env.example
```

Required variables:

```env
MONGODB_URI=your-application-mongodb-uri
MONGODB_ADMIN_URI=your-maintenance-mongodb-uri
MONGODB_DATABASE=supportlab
```

The normal application credential should use only the permissions necessary for application data access.

Administrative database operations can use a separate maintenance credential.

Never commit `.env`.

---

# Common Commands

## Build

```bash
npm run build
```

## Run tests

```bash
npm test
```

## Seed healthy sample data

```bash
npm run seed
```

## Run API

```bash
npm run dev
```

## Run MongoDB query examples

```bash
npm run query
```

## Diagnose a user

```bash
npm run diagnose -- alex@acme.example
```

## Run account-health report

```bash
npm run health
```

## Preview V1 → V2 migration

```bash
npm run migrate:v1-v2:dry
```

## Run V1 → V2 migration

```bash
npm run migrate:v1-v2
```

## Audit stored email values

```bash
npm run db:audit-emails
```

## Preview email cleanup

```bash
npm run normalize:emails:dry
```

## Apply email cleanup

```bash
npm run normalize:emails
```

## Apply MongoDB validation

```bash
npm run db:validation
```

## Test MongoDB validation

```bash
npm run db:test-validation
```

## Create / verify indexes

```bash
npm run db:indexes
```

## Test unique email enforcement

```bash
npm run db:test-unique-email
```

---

# Incident Lab Lifecycle

The repository intentionally records the progression from healthy system to incident simulation and finally to a hardened system.

```text
1. Build healthy SaaS baseline
        ↓
2. Seed known-good customer data
        ↓
3. Introduce simulated incidents
        ↓
4. Reproduce each issue
        ↓
5. Investigate through logs/code/data
        ↓
6. Establish root cause
        ↓
7. Apply targeted remediation
        ↓
8. Validate fixes
        ↓
9. Migrate legacy records
        ↓
10. Build reusable diagnostics
        ↓
11. Audit remaining data
        ↓
12. Add database validation and indexes
        ↓
13. Harden final environment
```

The incident seed deliberately creates historical states that would no longer be accepted by the final hardened MongoDB configuration.

For example, SUP-103 uses a schema-version-1 account document.

After strict V2 MongoDB validation has been applied, MongoDB should correctly reject attempts to recreate that obsolete record.

This is intentional.

Earlier incident states remain visible through:

- Git history;
- incident documentation;
- the incident seed source code.

---

# Support Engineering Safety Decisions

The project deliberately implements several practices intended to make diagnosis and remediation safer.

### Secrets

Database credentials are stored outside source control.

```text
.env           → ignored
.env.example   → committed
```

### Least Privilege

Application and maintenance operations can use separate MongoDB credentials.

### Guarded Updates

Remediation scripts do not update documents solely by ID.

Where appropriate, filters also include the previously investigated state.

This reduces the risk of applying stale remediation after data has changed.

### Dry Runs

Migration and bulk cleanup utilities support previewing intended transformations without modifying the database.

### Collision Detection

Email normalisation checks whether another user already owns the canonical target address before writing.

### Post-Write Validation

Important remediation and migration operations re-read records after modification to verify the persisted result.

### Structured Audit Logs

Migration and remediation actions emit structured events.

### Diagnostics Do Not Self-Heal

The diagnostic CLI reports suspicious state but deliberately does not silently repair customer data.

Investigation and remediation remain separate operations.

---

# Example Product Support Workflow

A typical investigation might begin with:

> "CSV Export is unavailable for my account."

The support workflow could be:

```text
1. Reproduce through API
2. Capture HTTP response
3. Search structured logs
4. Identify user/account IDs
5. Query user document
6. Query linked account document
7. Compare with known-good customer
8. Trace TypeScript decision path
9. Determine whether fault is:
      - customer data
      - account configuration
      - legacy schema
      - input edge case
      - application code
10. Establish root cause
11. Select safest remediation
12. Validate database state
13. Validate application behaviour
14. Regression test
15. Document RCA
16. Identify preventative/systemic improvement
```

---

# Key Engineering Lessons

## Correct data does not guarantee correct application behaviour

SUP-102 demonstrated that MongoDB can contain the correct value while TypeScript application logic still interprets it incorrectly.

---

## Correct application logic does not guarantee correct persisted data

SUP-101 demonstrated that valid application logic may still produce incorrect customer behaviour when account configuration is inconsistent.

---

## Static types do not validate historical database records

SUP-103 demonstrated that TypeScript interfaces describe expected structures but do not guarantee that older persisted MongoDB documents conform to them.

---

## Normalisation must be symmetrical

SUP-104 demonstrated that normalising reads without enforcing the same canonical form during writes can make valid records unreachable.

---

## A fix is not complete until it is validated

Remediation was validated at multiple levels where appropriate:

```text
database state
+
application response
+
structured logs
+
regression behaviour
```

---

## Support investigations can become reusable tooling

Checks repeatedly performed during manual incidents were converted into:

```text
diagnostic CLI
account-health report
data audit scripts
migration utilities
validation checks
```

This reduces repeated manual investigation effort and improves future time-to-resolution.

---

# Portfolio Scope

SupportLab is a **portfolio and learning project**, not a claim of commercial MongoDB or TypeScript production experience.

It demonstrates hands-on project experience using TypeScript and MongoDB to:

- investigate application issues;
- query and validate customer-style data;
- trace backend application behaviour;
- analyse structured logs;
- diagnose root causes;
- perform guarded data remediation;
- migrate legacy schemas;
- validate migration results;
- build reusable diagnostic tooling;
- implement database validation and indexing.

The project intentionally prioritises depth of Product Support Engineering investigation over application size.

---

# Repository

GitHub:

**https://github.com/LeelooCodes/SupportLab**
