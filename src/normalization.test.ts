import assert from "node:assert/strict";
import test from "node:test";

import {
    normalizeEmail
} from "./normalization";

test(
    "normalizes mixed-case email addresses",
    () => {
        assert.equal(
            normalizeEmail(
                "Taylor@Orbit.Example"
            ),
            "taylor@orbit.example"
        );
    }
);

test(
    "normalizes uppercase email addresses",
    () => {
        assert.equal(
            normalizeEmail(
                "TAYLOR@ORBIT.EXAMPLE"
            ),
            "taylor@orbit.example"
        );
    }
);

test(
    "preserves already canonical email addresses",
    () => {
        assert.equal(
            normalizeEmail(
                "taylor@orbit.example"
            ),
            "taylor@orbit.example"
        );
    }
);

test(
    "removes surrounding whitespace",
    () => {
        assert.equal(
            normalizeEmail(
                "  Taylor@Orbit.Example  "
            ),
            "taylor@orbit.example"
        );
    }
);