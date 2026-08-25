import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(cleanup);

// A complete, valid (but fake) config so getEnv() never blocks a unit test.
// These values are never used outside this test run.
process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/test";
process.env.RESPONSE_ENCRYPTION_KEY ??= "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
process.env.HOST_PASSWORD_HASH ??= "scrypt:00:16384:8:1:00";
process.env.HOST_SESSION_SECRET ??= "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
process.env.VACATION_DESTINATION ??= "Test Destination";
process.env.VACATION_START ??= "2027-01-10T14:00:00+02:00";
process.env.VACATION_END ??= "2027-01-17T11:00:00+02:00";
process.env.FINAL_PRIVATE_NOTE ??= "A test note.";
process.env.PUBLIC_SITE_ORIGIN ??= "https://example.com";
