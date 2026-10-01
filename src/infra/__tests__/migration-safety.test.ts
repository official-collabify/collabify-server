import { describe, it, expect } from "bun:test";
import { validateMigrationSql } from "../../../scripts/check-migration-safety";

describe("Migration Safety Linter", () => {
  it("passes safe additive migrations", () => {
    const safeSql = `
      -- CreateTable
      CREATE TABLE "notifications" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- AddColumn
      ALTER TABLE "users" ADD COLUMN "phone" TEXT;
      ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
    `;
    const result = validateMigrationSql(safeSql);
    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("detects and rejects DROP COLUMN", () => {
    const unsafeSql = `ALTER TABLE "users" DROP COLUMN "old_field";`;
    const result = validateMigrationSql(unsafeSql);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("DROP COLUMN"))).toBe(true);
  });

  it("detects and rejects DROP TABLE", () => {
    const unsafeSql = `DROP TABLE "legacy_data";`;
    const result = validateMigrationSql(unsafeSql);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("DROP TABLE"))).toBe(true);
  });

  it("detects and rejects TRUNCATE", () => {
    const unsafeSql = `TRUNCATE TABLE "chat_messages";`;
    const result = validateMigrationSql(unsafeSql);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("TRUNCATE"))).toBe(true);
  });

  it("detects and rejects adding NOT NULL column without a DEFAULT", () => {
    const unsafeSql = `ALTER TABLE "users" ADD COLUMN "required_phone" TEXT NOT NULL;`;
    const result = validateMigrationSql(unsafeSql);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("NOT NULL without DEFAULT"))).toBe(true);
  });

  it("allows intentional destructive operations when annotated with safety-override", () => {
    const overriddenSql = `
      -- safety-override: approved
      ALTER TABLE "projects" DROP COLUMN IF EXISTS "logo_url";
    `;
    const result = validateMigrationSql(overriddenSql);
    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });
});
