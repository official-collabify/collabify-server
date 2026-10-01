#!/usr/bin/env bun
/**
 * check-migration-safety.ts
 *
 * Scans Prisma migrations for dangerous/destructive SQL statements:
 * - DROP COLUMN
 * - DROP TABLE
 * - TRUNCATE
 * - Adding a NOT NULL column without a DEFAULT
 *
 * Destructive operations violate the expand-and-contract rule and can cause
 * data loss or crash in-flight application traffic.
 *
 * To allow an intentional, approved destructive migration, add:
 *   -- safety-override: approved
 * at the top of the migration.sql file with justification.
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export interface DangerousPattern {
  name: string;
  regex: RegExp;
  message: string;
}

export const DANGEROUS_PATTERNS: DangerousPattern[] = [
  {
    name: "DROP_COLUMN",
    regex: /\bDROP\s+COLUMN\b/i,
    message: "DROP COLUMN detected. Violates expand-and-contract policy.",
  },
  {
    name: "DROP_TABLE",
    regex: /\bDROP\s+TABLE\b/i,
    message: "DROP TABLE detected. Violates expand-and-contract policy.",
  },
  {
    name: "TRUNCATE",
    regex: /\bTRUNCATE\b/i,
    message: "TRUNCATE detected. Will cause permanent data loss.",
  },
  {
    name: "NOT_NULL_WITHOUT_DEFAULT",
    regex: /\bADD\s+COLUMN\s+[^;]+\bNOT\s+NULL\b(?!\s+DEFAULT\b)/i,
    message: "Adding NOT NULL without DEFAULT can lock large tables or fail on existing rows.",
  },
];

export const OVERRIDE_COMMENT = "-- safety-override: approved";

/**
 * Validates a single migration SQL string against dangerous patterns.
 */
export function validateMigrationSql(sql: string): ValidationResult {
  if (sql.includes(OVERRIDE_COMMENT)) {
    return { isValid: true, issues: [] };
  }

  const issues: string[] = [];

  for (const { name, regex, message } of DANGEROUS_PATTERNS) {
    if (regex.test(sql)) {
      issues.push(`[${name}] ${message}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Baseline: Historical migrations created before this timestamp are already applied
 * in production and locked in migration_lock.toml. Only migrations strictly AFTER
 * this baseline (or all migrations if checkAll=true) are subjected to the linter.
 */
export const HISTORICAL_BASELINE = "20260425062034_meniton";

export interface ScanResult {
  totalChecked: number;
  failedMigrations: { name: string; issues: string[] }[];
}

export function scanMigrationsDirectory(
  migrationsDir: string,
  options: { checkAll?: boolean } = {}
): ScanResult {
  if (!existsSync(migrationsDir)) {
    return { totalChecked: 0, failedMigrations: [] };
  }

  const entries = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const failedMigrations: { name: string; issues: string[] }[] = [];
  let totalChecked = 0;

  for (const dirName of entries) {
    // If not checkAll, skip historical baseline migrations
    if (!options.checkAll && dirName <= HISTORICAL_BASELINE) {
      continue;
    }

    const sqlPath = join(migrationsDir, dirName, "migration.sql");
    if (!existsSync(sqlPath)) continue;

    totalChecked++;
    const sqlContent = readFileSync(sqlPath, "utf-8");
    const { isValid, issues } = validateMigrationSql(sqlContent);

    if (!isValid) {
      failedMigrations.push({ name: dirName, issues });
    }
  }

  return { totalChecked, failedMigrations };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Runner
// ─────────────────────────────────────────────────────────────────────────────
// @ts-ignore — Bun-specific CLI execution
if (import.meta.main) {
  const checkAll = process.argv.includes("--all");
  // @ts-ignore — Bun-specific directory resolution
  const migrationsDir = resolve(import.meta.dir, "../prisma/migrations");

  console.log(`🔎 Scanning Prisma migrations in ${migrationsDir}...`);
  if (!checkAll) {
    console.log(`ℹ️  Checking migrations after baseline: ${HISTORICAL_BASELINE}`);
  } else {
    console.log(`ℹ️  Checking ALL historical migrations`);
  }

  const { totalChecked, failedMigrations } = scanMigrationsDirectory(migrationsDir, { checkAll });

  console.log(`Checked ${totalChecked} migration(s).`);

  if (failedMigrations.length > 0) {
    console.error(`\n❌ Migration Safety Violations Found (${failedMigrations.length}):`);
    for (const { name, issues } of failedMigrations) {
      console.error(`\nMigration: ${name}`);
      for (const issue of issues) {
        console.error(`  - ${issue}`);
      }
    }
    console.error(
      `\nTo override an intentional, vetted destructive migration, add:\n  ${OVERRIDE_COMMENT}\nat the top of the migration.sql file with justification.`
    );
    process.exit(1);
  } else {
    console.log("✅ All migrations passed safety checks.");
    process.exit(0);
  }
}
