import {
    closeDatabaseConnection,
    connectToDatabase
} from "../src/db";

import {
    User
} from "../src/types";

import {
    normalizeEmail
} from "../src/normalization";

import {
    logger
} from "../src/logger";

async function normalizeUserEmails(): Promise<void> {
    const dryRun =
        process.argv.includes("--dry-run");

    const db = await connectToDatabase();

    try {
        const users =
            db.collection<User>("users");

        const allUsers =
            await users.find({}).toArray();

        let alreadyCanonical = 0;
        let changed = 0;
        let conflicts = 0;

        for (const user of allUsers) {
            const canonicalEmail =
                normalizeEmail(user.email);

            if (canonicalEmail === user.email) {
                alreadyCanonical++;
                continue;
            }

            /*
             * Before changing the address, make sure another
             * document does not already use the canonical form.
             */
            const conflictingUser =
                await users.findOne({
                    email: canonicalEmail,
                    _id: {
                        $ne: user._id
                    }
                });

            if (conflictingUser) {
                conflicts++;

                logger.error({
                    event: "email_normalization_conflict",
                    userId:
                        user._id.toHexString(),
                    currentEmail:
                        user.email,
                    canonicalEmail,
                    conflictingUserId:
                        conflictingUser._id.toHexString()
                });

                console.error(
                    `Conflict: ${user.email} cannot be normalized to ${canonicalEmail}`
                );

                continue;
            }

            console.log(
                `${user.email} -> ${canonicalEmail}`
            );

            if (dryRun) {
                continue;
            }

            const result =
                await users.updateOne(
                    {
                        _id: user._id,
                        email: user.email
                    },
                    {
                        $set: {
                            email: canonicalEmail
                        }
                    }
                );

            if (
                result.matchedCount !== 1 ||
                result.modifiedCount !== 1
            ) {
                throw new Error(
                    `Failed to normalize user ${user._id.toHexString()}`
                );
            }

            const updatedUser =
                await users.findOne({
                    _id: user._id
                });

            if (
                !updatedUser ||
                updatedUser.email !== canonicalEmail
            ) {
                throw new Error(
                    `Post-update validation failed for user ${user._id.toHexString()}`
                );
            }

            changed++;

            logger.info({
                event: "user_email_normalized",
                userId:
                    user._id.toHexString(),
                oldEmail:
                    user.email,
                newEmail:
                    canonicalEmail
            });
        }

        console.log();
        console.log("Email normalization summary:");
        console.log(
            `Already canonical: ${alreadyCanonical}`
        );
        console.log(
            `Changed: ${changed}`
        );
        console.log(
            `Conflicts: ${conflicts}`
        );

        logger.info({
            event: "email_normalization_completed",
            alreadyCanonical,
            changed,
            conflicts,
            dryRun
        });
    } finally {
        await closeDatabaseConnection();
    }
}

normalizeUserEmails().catch(
    (error: unknown) => {
        logger.error({
            event: "email_normalization_failed",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error"
        });

        console.error(
            "Email normalization failed:",
            error
        );

        process.exit(1);
    }
);