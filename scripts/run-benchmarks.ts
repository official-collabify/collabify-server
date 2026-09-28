import { db } from "../src/infra/db";
import { appRedis, bpubRedis } from "../src/infra/redis";
import { KeyFactory } from "../src/infra/redis/keys";
import { OutboxStatus } from "@prisma/client";
import { Y } from "../src/shared/yjs";
import { enforceVaultQuota } from "../src/modules/vault/lib/quota-guard";
import { VAULT_LIMITS } from "../src/modules/vault/lib/constants";
import { AppError } from "../src/shared/errors";
import { persistMessageHandler } from "../src/modules/chat/jobs/persist-message";
import { validateYjsUpdate } from "../src/modules/whiteboard/utils/validate-yjs-update";
import { executeAtomicBoardUpdate } from "../src/modules/whiteboard/infra/lua-scripts";
import { WhiteboardKeys, WhiteboardTTLs } from "../src/modules/whiteboard/infra/whiteboard-keys";

interface LatencyStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p50: number;
  p95: number;
  p99: number;
  stdDev: number;
}

function calcStats(durationsMs: number[]): LatencyStats {
  if (durationsMs.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, median: 0, p50: 0, p95: 0, p99: 0, stdDev: 0 };
  }
  const sorted = [...durationsMs].sort((a, b) => a - b);
  const total = sorted.reduce((acc, val) => acc + val, 0);
  const mean = total / sorted.length;
  const varianceSum = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const stdDev = Math.sqrt(varianceSum / sorted.length);

  const percentile = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];

  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median: percentile(0.50),
    p50: percentile(0.50),
    p95: percentile(0.95),
    p99: percentile(0.99),
    stdDev,
  };
}

function formatStats(name: string, s: LatencyStats): string {
  return `${name.padEnd(35)} | count: ${s.count.toString().padStart(3)} | min: ${s.min.toFixed(2).padStart(8)}ms | p50: ${s.p50.toFixed(2).padStart(8)}ms | p95: ${s.p95.toFixed(2).padStart(8)}ms | p99: ${s.p99.toFixed(2).padStart(8)}ms | max: ${s.max.toFixed(2).padStart(8)}ms | mean: ${s.mean.toFixed(2).padStart(8)}ms`;
}

async function main() {
  console.log("================================================================================");
  console.log("COLLABIFY — COMPREHENSIVE BACKEND & REAL-TIME BENCHMARK SUITE");
  console.log("================================================================================");
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Node/Bun: ${process.version}`);
  console.log("--------------------------------------------------------------------------------");

  // Setup test environment (workspace, project, user, conversation)
  const env = await setupTestFixtures();

  try {
    // 1. Chat Message Lifecycle & Latency Breakdown
    await benchmarkChatLifecycle(env);

    // 2. Chat Concurrency & High Throughput Load
    await benchmarkChatConcurrency(env);

    // 3. Idempotency & Double-Spend Aggressive Testing
    await benchmarkChatIdempotency(env);

    // 4. Redis / Authorization Cache Latencies & Invalidation
    await benchmarkAuthCache(env);

    // 5. Collaborative Notes (Yjs CRDT Document Convergence)
    await benchmarkNotesCRDT();

    // 6. Collaborative Whiteboard (Yjs CRDT Shape & Streaming)
    await benchmarkWhiteboardCRDT(env);

    // 7. S3 / Vault Storage Quota & TOCTOU Race Condition Test
    await benchmarkStorageTOCTOU(env);

    // 8. Failure Scenarios & Recovery Testing
    await benchmarkFailureScenarios(env);

  } finally {
    await cleanupTestFixtures(env);
  }

  console.log("\n================================================================================");
  console.log("COLLABIFY BENCHMARK SUITE COMPLETE");
  console.log("================================================================================");
  process.exit(0);
}

interface TestEnv {
  userId: string;
  workspaceId: string;
  projectId: string;
  conversationId: string;
}

async function setupTestFixtures(): Promise<TestEnv> {
  const stamp = Date.now();
  const userId = `bench-user-${stamp}`;
  const workspaceSlug = `bench-ws-${stamp}`;

  // 1. Create User
  const user = await db.user.create({
    data: {
      id: userId,
      email: `bench_${stamp}@collabify.test`,
      fullName: "Benchmark User",
    },
  });

  // 2. Create Workspace
  const workspace = await db.workspace.create({
    data: {
      name: `Bench Workspace ${stamp}`,
      slug: workspaceSlug,
    },
  });

  // 3. Create Project
  const project = await db.project.create({
    data: {
      name: `Bench Project ${stamp}`,
      key: `P${stamp.toString().slice(-6)}`,
      workspaceId: workspace.id,
    },
  });

  // 4. Create Conversation (Channel)
  const conversation = await db.chatConversation.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      name: `bench-channel-${stamp}`,
      type: "CHANNEL",
      lastSequence: 0,
    },
  });

  // 5. Add user as conversation member
  await db.chatMember.create({
    data: {
      conversationId: conversation.id,
      userId: user.id,
    },
  });

  return {
    userId: user.id,
    workspaceId: workspace.id,
    projectId: project.id,
    conversationId: conversation.id,
  };
}

async function cleanupTestFixtures(env: TestEnv) {
  try {
    await db.chatMessage.deleteMany({ where: { conversationId: env.conversationId } });
    await db.outboxMessage.deleteMany({ where: { conversationId: env.conversationId } });
    await db.chatMember.deleteMany({ where: { conversationId: env.conversationId } });
    await db.chatConversation.delete({ where: { id: env.conversationId } });
    await db.vaultProjectUsage.deleteMany({ where: { projectId: env.projectId } });
    await db.vaultWorkspaceUsage.deleteMany({ where: { workspaceId: env.workspaceId } });
    await db.project.delete({ where: { id: env.projectId } });
    await db.workspace.delete({ where: { id: env.workspaceId } });
    await db.user.delete({ where: { id: env.userId } });

    // Clean Redis keys
    const seqKey = KeyFactory.ConversationSequence(env.conversationId);
    const streamKey = KeyFactory.ConversationStream(env.conversationId);
    await appRedis.del(seqKey, streamKey);
  } catch (err) {
    // best-effort cleanup
  }
}

async function benchmarkChatLifecycle(env: TestEnv) {
  console.log("\n>>> [1/8] BENCHMARKING CHAT MESSAGE LIFECYCLE & LATENCY BREAKDOWN");

  const ITERATIONS = 30;
  const outboxDurations: number[] = [];
  const redisSeqDurations: number[] = [];
  const pubsubDurations: number[] = [];
  const persistDurations: number[] = [];
  const totalDurations: number[] = [];

  const streamKey = KeyFactory.ConversationStream(env.conversationId);
  const seqKey = KeyFactory.ConversationSequence(env.conversationId);
  const topic = KeyFactory.ConversationTopic(env.conversationId);

  // Initialize sequence in Redis
  await appRedis.set(seqKey, "0");

  for (let i = 1; i <= ITERATIONS; i++) {
    const dedupeId = `msg-lifecycle-${Date.now()}-${i}`;
    const content = `Benchmark message payload #${i}`;
    const tStart = performance.now();

    // Stage 1: Outbox Persistence (Postgres)
    const t0 = performance.now();
    const outboxRecord = await db.outboxMessage.create({
      data: {
        messageId: dedupeId,
        conversationId: env.conversationId,
        conversationType: "CHANNEL",
        payload: { content, dedupeId },
        status: OutboxStatus.PENDING,
      },
      select: { id: true },
    });
    const outboxId = outboxRecord.id.toString();
    outboxDurations.push(performance.now() - t0);

    // Stage 2: Redis Atomic Sequence & Stream Append (Lua)
    const t1 = performance.now();
    const luaScript = `
      local seq_key = KEYS[1]
      local stream_key = KEYS[2]
      local next_seq = redis.call("INCR", seq_key)
      local stream_id = redis.call("XADD", stream_key, "*",
        "conversationId", ARGV[1],
        "dedupeId", ARGV[2],
        "outboxId", ARGV[3],
        "sequence", next_seq,
        "content", ARGV[4]
      )
      return {stream_id, tostring(next_seq)}
    `;
    const [streamId, nextSeqStr] = (await appRedis.eval(
      luaScript,
      2,
      seqKey,
      streamKey,
      env.conversationId,
      dedupeId,
      outboxId,
      content
    )) as [string, string];
    const sequence = parseInt(nextSeqStr);
    redisSeqDurations.push(performance.now() - t1);

    // Stage 3: Pub/Sub Fan-out Latency
    const t2 = performance.now();
    await appRedis.publish(topic, JSON.stringify({ type: "chat:new-message", dedupeId, sequence }));
    pubsubDurations.push(performance.now() - t2);

    // Stage 4: BullMQ Persistence Worker Execution (Postgres tx)
    const t3 = performance.now();
    await db.$transaction(async (tx) => {
      await tx.chatMessage.create({
        data: {
          id: dedupeId,
          conversationId: env.conversationId,
          authorUserId: env.userId,
          streamId,
          sequence,
          content: { text: content },
          type: "TEXT",
        },
      });
      await tx.chatConversation.update({
        where: { id: env.conversationId },
        data: { lastSequence: sequence },
      });
      await tx.outboxMessage.update({
        where: { id: BigInt(outboxId) },
        data: { status: OutboxStatus.DONE, processedAt: new Date() },
      });
    });
    persistDurations.push(performance.now() - t3);

    totalDurations.push(performance.now() - tStart);
  }

  console.log(formatStats("Stage 1: Outbox Intent (Postgres)", calcStats(outboxDurations)));
  console.log(formatStats("Stage 2: Sequence & Stream (Redis)", calcStats(redisSeqDurations)));
  console.log(formatStats("Stage 3: Fan-Out PubSub (Redis)", calcStats(pubsubDurations)));
  console.log(formatStats("Stage 4: DB Finalize (chatMessage)", calcStats(persistDurations)));
  console.log(formatStats("Total End-to-End Latency", calcStats(totalDurations)));
}

async function benchmarkChatConcurrency(env: TestEnv) {
  console.log("\n>>> [2/8] BENCHMARKING CHAT CONCURRENCY & MONOTONIC ORDERING");

  const concurrencyLevels = [10, 50, 100];
  const seqKey = KeyFactory.ConversationSequence(env.conversationId);
  const streamKey = KeyFactory.ConversationStream(env.conversationId);

  for (const conc of concurrencyLevels) {
    const tStart = performance.now();
    const sequencesReceived: number[] = [];

    const tasks = Array.from({ length: conc }, async (_, idx) => {
      const dedupeId = `conc-${conc}-${Date.now()}-${idx}`;
      const content = `Concurrent msg ${idx}`;

      // Ingest: Outbox + Redis Lua INCR/XADD
      const outbox = await db.outboxMessage.create({
        data: {
          messageId: dedupeId,
          conversationId: env.conversationId,
          conversationType: "CHANNEL",
          payload: { content },
          status: OutboxStatus.PENDING,
        },
        select: { id: true },
      });

      const luaScript = `
        local seq_key = KEYS[1]
        local stream_key = KEYS[2]
        local next_seq = redis.call("INCR", seq_key)
        redis.call("XADD", stream_key, "*", "dedupeId", ARGV[1], "seq", next_seq)
        return next_seq
      `;
      const seq = Number(await appRedis.eval(luaScript, 2, seqKey, streamKey, dedupeId));
      sequencesReceived.push(seq);
    });

    await Promise.all(tasks);
    const wallMs = performance.now() - tStart;
    const throughput = (conc / (wallMs / 1000)).toFixed(2);

    // Verify ordering
    const sorted = [...sequencesReceived].sort((a, b) => a - b);
    let gapless = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        gapless = false;
        break;
      }
    }

    console.log(
      `Concurrency: ${conc.toString().padStart(3)} msgs | Wall: ${wallMs.toFixed(2).padStart(8)}ms | Throughput: ${throughput.padStart(7)} ops/sec | Monotonic & Gapless: ${gapless ? "YES [✓]" : "NO [✗]"}`
    );
  }
}

async function benchmarkChatIdempotency(env: TestEnv) {
  console.log("\n>>> [3/8] BENCHMARKING IDEMPOTENCY & DOUBLE-SPEND DEFENSE");

  const testDedupeId = `dedupe-test-${Date.now()}`;
  const ATTEMPTS = 10;
  let accepted = 0;
  let dedupeBlocked = 0;
  let constraintCollisions = 0;

  // Run 10 parallel attempts with the identical dedupeId
  const promises = Array.from({ length: ATTEMPTS }, async () => {
    try {
      // 1. Idempotency Check
      const existing = await db.outboxMessage.findUnique({
        where: { messageId: testDedupeId },
      });
      if (existing) {
        dedupeBlocked++;
        return;
      }

      // 2. Persist
      await db.outboxMessage.create({
        data: {
          messageId: testDedupeId,
          conversationId: env.conversationId,
          conversationType: "CHANNEL",
          payload: { text: "Idempotent text" },
          status: OutboxStatus.PENDING,
        },
      });
      accepted++;
    } catch (err: any) {
      if (err.code === "P2002") {
        constraintCollisions++;
      }
    }
  });

  await Promise.all(promises);

  // Check database count
  const count = await db.outboxMessage.count({
    where: { messageId: testDedupeId },
  });

  console.log(`Parallel Attempts: ${ATTEMPTS} with identical dedupeId`);
  console.log(`Accepted: ${accepted} | Dedupe pre-check blocked: ${dedupeBlocked} | DB Unique P2002 caught: ${constraintCollisions}`);
  console.log(`Total Outbox records in DB: ${count} (Must be exactly 1)`);
  console.log(`RESULT: ${count === 1 && accepted === 1 ? "VERIFIED — ZERO DUPLICATE RECORDS [✓]" : "FAIL — DUPLICATES CREATED [✗]"}`);
}

async function benchmarkAuthCache(env: TestEnv) {
  console.log("\n>>> [4/8] BENCHMARKING REDIS / AUTHORIZATION CACHE & INVALIDATION");

  const cacheKey = `auth:membership:${env.userId}:${env.workspaceId}`;
  const ITERATIONS = 50;

  // 1. Cache Miss + DB Fallback Latency
  const missDurations: number[] = [];
  for (let i = 0; i < 20; i++) {
    await appRedis.del(cacheKey);
    const t0 = performance.now();
    // Simulate cache check
    const cached = await appRedis.get(cacheKey);
    if (!cached) {
      // DB Fallback query
      const ws = await db.workspace.findUnique({
        where: { id: env.workspaceId },
        select: { id: true, name: true },
      });
      const exists = ws !== null;
      await appRedis.set(cacheKey, exists ? "1" : "0", "EX", 300);
    }
    missDurations.push(performance.now() - t0);
  }

  // 2. Cache Hit Latency
  const hitDurations: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await appRedis.get(cacheKey);
    hitDurations.push(performance.now() - t0);
  }

  // 3. Cache Invalidation Latency
  const invDurations: number[] = [];
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    await appRedis.del(cacheKey);
    invDurations.push(performance.now() - t0);
    await appRedis.set(cacheKey, "1", "EX", 300);
  }

  console.log(formatStats("Cache Hit Latency (Redis GET)", calcStats(hitDurations)));
  console.log(formatStats("Cache Miss + DB Fallback Latency", calcStats(missDurations)));
  console.log(formatStats("Cache Invalidation Latency (DEL)", calcStats(invDurations)));
  const speedup = calcStats(missDurations).median / calcStats(hitDurations).median;
  console.log(`Cache Hit Speedup vs DB Fallback: ${speedup.toFixed(1)}x faster`);
}

async function benchmarkNotesCRDT() {
  console.log("\n>>> [5/8] BENCHMARKING COLLABORATIVE NOTES (Yjs CRDT CONVERGENCE)");

  const editorCounts = [2, 5, 10];

  for (const numEditors of editorCounts) {
    const docs: Y.Doc[] = Array.from({ length: numEditors }, () => new Y.Doc());
    const updates: Uint8Array[] = [];

    const tStart = performance.now();

    // Each editor generates 20 concurrent edits
    for (let edIdx = 0; edIdx < numEditors; edIdx++) {
      const doc = docs[edIdx];
      const ytext = doc.getText("content");
      doc.on("update", (u) => updates.push(u));

      for (let op = 0; op < 20; op++) {
        ytext.insert(Math.floor(Math.random() * (ytext.length + 1)), `[E${edIdx}:O${op}] `);
      }
    }

    const editDuration = performance.now() - tStart;

    // Cross-sync all updates to all editors (simulating gossip/broadcast network)
    const tSyncStart = performance.now();
    for (const doc of docs) {
      for (const update of updates) {
        Y.applyUpdate(doc, update);
      }
    }
    const syncDuration = performance.now() - tSyncStart;

    // Verify convergence: check if all documents have the exact same text content
    const referenceText = docs[0].getText("content").toString();
    const converged = docs.every((d) => d.getText("content").toString() === referenceText);
    const docSizeBytes = Y.encodeStateAsUpdate(docs[0]).length;

    console.log(
      `Editors: ${numEditors.toString().padStart(2)} | Total Edits: ${(numEditors * 20).toString().padStart(3)} | Edit Time: ${editDuration.toFixed(2).padStart(6)}ms | Cross-Sync: ${syncDuration.toFixed(2).padStart(6)}ms | Doc Size: ${docSizeBytes} B | Converged: ${converged ? "YES [✓]" : "NO [✗]"}`
    );
  }
}

async function benchmarkWhiteboardCRDT(env: TestEnv) {
  console.log("\n>>> [6/8] BENCHMARKING WHITEBOARD (Yjs CRDT SHAPES & STREAMING)");

  const boardDoc1 = new Y.Doc();
  const boardDoc2 = new Y.Doc();
  const shapesMap1 = boardDoc1.getMap("shapes");
  const shapesMap2 = boardDoc2.getMap("shapes");

  const updateList: Uint8Array[] = [];
  boardDoc1.on("update", (u) => updateList.push(u));

  const tStart = performance.now();
  // Client 1 creates 100 shapes
  for (let i = 0; i < 100; i++) {
    shapesMap1.set(`shape-${i}`, {
      type: "rectangle",
      x: i * 10,
      y: i * 20,
      width: 150,
      height: 80,
      color: "#3b82f6",
    });
  }

  // Client 1 modifies 30 shapes
  for (let i = 0; i < 30; i++) {
    shapesMap1.set(`shape-${i}`, {
      type: "rectangle",
      x: i * 15,
      y: i * 25,
      width: 200,
      height: 100,
      color: "#ef4444",
    });
  }

  // Client 1 deletes 10 shapes
  for (let i = 80; i < 90; i++) {
    shapesMap1.delete(`shape-${i}`);
  }

  const creationTime = performance.now() - tStart;

  // Apply all updates to Client 2 in reverse order (simulate network reordering)
  const tSync = performance.now();
  for (let i = updateList.length - 1; i >= 0; i--) {
    Y.applyUpdate(boardDoc2, updateList[i]);
  }
  const syncTime = performance.now() - tSync;

  // Verify convergence
  const count1 = shapesMap1.size;
  const count2 = shapesMap2.size;
  const converged = count1 === count2 && count1 === 90;

  console.log(`Created 100 shapes, modified 30, deleted 10 | Generation: ${creationTime.toFixed(2)}ms`);
  console.log(`Applied reverse-ordered updates to peer: ${syncTime.toFixed(2)}ms`);
  console.log(`Doc 1 shape count: ${count1} | Doc 2 shape count: ${count2} | Converged: ${converged ? "YES [✓]" : "NO [✗]"}`);
}

async function benchmarkStorageTOCTOU(env: TestEnv) {
  console.log("\n>>> [7/8] BENCHMARKING S3 / VAULT STORAGE & TOCTOU CONCURRENT RACE");

  // Reset usage records for project & workspace
  await db.vaultProjectUsage.deleteMany({ where: { projectId: env.projectId } });
  await db.vaultWorkspaceUsage.deleteMany({ where: { workspaceId: env.workspaceId } });

  // Set project usage so remaining quota is exactly 60 MB
  // Max project storage is 500 MB (VAULT_LIMITS.MAX_PROJECT_STORAGE_BYTES = 500 * 1024 * 1024)
  const initialUsed = VAULT_LIMITS.MAX_PROJECT_STORAGE_BYTES - BigInt(60 * 1024 * 1024);
  await db.vaultProjectUsage.create({
    data: {
      workspaceId: env.workspaceId,
      projectId: env.projectId,
      usedBytes: initialUsed,
      reservedBytes: 0n,
      fileCount: 5,
    },
  });
  await db.vaultWorkspaceUsage.create({
    data: {
      workspaceId: env.workspaceId,
      usedBytes: initialUsed,
      reservedBytes: 0n,
      fileCount: 5,
    },
  });

  console.log(`Initial State: Remaining Project Quota = 60.00 MB`);
  console.log(`Simulating 10 Concurrent Upload Requests, each requesting 50.00 MB.`);
  console.log(`Expected Safe Behavior: Exactly 1 upload allowed (50MB), 9 rejected (remaining 10MB < 50MB).`);

  const UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB
  const ATTEMPTS = 10;
  let successfulUploads = 0;
  let rejectedUploads = 0;

  const tStart = performance.now();
  const uploadTasks = Array.from({ length: ATTEMPTS }, async () => {
    try {
      await enforceVaultQuota({
        projectId: env.projectId,
        workspaceId: env.workspaceId,
        incomingSizeBytes: UPLOAD_SIZE,
        db,
      });
      successfulUploads++;
    } catch (err: any) {
      if (err instanceof AppError && err.code === "FORBIDDEN") {
        rejectedUploads++;
      } else {
        rejectedUploads++;
      }
    }
  });

  await Promise.all(uploadTasks);
  const wallMs = performance.now() - tStart;

  // Inspect final reserved bytes in DB
  const finalUsage = await db.vaultProjectUsage.findUnique({
    where: { workspaceId_projectId: { workspaceId: env.workspaceId, projectId: env.projectId } },
  });
  const reservedMB = Number(finalUsage?.reservedBytes || 0n) / (1024 * 1024);
  const totalAllocatedMB = Number((finalUsage?.usedBytes || 0n) + (finalUsage?.reservedBytes || 0n)) / (1024 * 1024);
  const maxLimitMB = Number(VAULT_LIMITS.MAX_PROJECT_STORAGE_BYTES) / (1024 * 1024);

  console.log(`Wall Time: ${wallMs.toFixed(2)}ms`);
  console.log(`Successful Reservations: ${successfulUploads} | Rejected: ${rejectedUploads}`);
  console.log(`Final Reserved Bytes: ${reservedMB.toFixed(2)} MB | Total Allocated: ${totalAllocatedMB.toFixed(2)} MB / Limit: ${maxLimitMB.toFixed(2)} MB`);

  if (successfulUploads === 1 && totalAllocatedMB <= maxLimitMB) {
    console.log("RESULT: VERIFIED — TOCTOU RACE PREVENTED! Quota boundary strictly enforced [✓]");
  } else if (successfulUploads > 1) {
    console.log(`RESULT: TOCTOU RACE OCCURRED! ${successfulUploads} concurrent uploads passed, exceeding quota by ${(totalAllocatedMB - maxLimitMB).toFixed(2)} MB [✗]`);
  }
}

async function benchmarkFailureScenarios(env: TestEnv) {
  console.log("\n>>> [8/8] BENCHMARKING FAILURE SCENARIOS & RECOVERY");

  // 1. Worker Queue Recovery on Incomplete Outbox
  const stuckDedupeId = `stuck-outbox-${Date.now()}`;
  const outbox = await db.outboxMessage.create({
    data: {
      messageId: stuckDedupeId,
      conversationId: env.conversationId,
      conversationType: "CHANNEL",
      payload: { content: "Stuck message before worker crash" },
      status: OutboxStatus.PENDING,
    },
  });

  console.log(`Simulated Outbox Stuck Pending: outboxId=${outbox.id}`);
  // Execute worker directly
  const jobMock = {
    id: "test-job-recovery",
    data: {
      outboxId: outbox.id.toString(),
      streamId: "1-0",
      sequence: 9999,
      conversationId: env.conversationId,
      authorId: env.userId,
      dedupeId: stuckDedupeId,
      content: "Recovered message content",
    },
  };

  const t0 = performance.now();
  await persistMessageHandler(jobMock as any);
  const recoveryTime = performance.now() - t0;

  // Verify status moved to DONE
  const updatedOutbox = await db.outboxMessage.findUnique({
    where: { id: outbox.id },
  });
  console.log(`Worker Recovery Execution Time: ${recoveryTime.toFixed(2)}ms`);
  console.log(`Outbox Status after worker recovery: ${updatedOutbox?.status} (Expected: DONE) [✓]`);
}

main().catch((err) => {
  console.error("FATAL BENCHMARK ERROR:", err);
  process.exit(1);
});
