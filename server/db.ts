import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  projects,
  InsertProject,
  proposals,
  InsertProposal,
  subsystems,
  InsertSubsystem,
  modules,
  InsertModule,
  tasks,
  InsertTask,
  agents,
  InsertAgent,
  agentActivityLogs,
  InsertAgentActivityLog,
  approvals,
  InsertApproval,
  knowledgeBase,
  InsertKnowledgeBase,
  deliverables,
  InsertDeliverable,
  taskDependencies,
  InsertTaskDependency,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Project operations
export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(project);
  const insertId = result[0].insertId;
  
  // Return the created project
  const created = await getProjectById(insertId);
  if (!created) throw new Error("Failed to retrieve created project");
  return created;
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result[0];
}

export async function getProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(eq(projects.createdBy, userId)).orderBy(desc(projects.createdAt));
}

export async function updateProjectStatus(projectId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({ status: status as any }).where(eq(projects.id, projectId));
}

// Agent operations
export async function createAgent(agent: InsertAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(agents).values(agent);
  return result[0].insertId;
}

export async function getAllAgents() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(agents);
}

export async function getAgentById(agentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  return result[0];
}

export async function updateAgentStatus(agentId: number, status: string, currentTaskId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(agents)
    .set({
      status: status as any,
      currentTaskId: currentTaskId ?? null,
    })
    .where(eq(agents.id, agentId));
}

// Proposal operations
export async function createProposal(proposal: InsertProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(proposals).values(proposal);
  return result[0].insertId;
}

export async function getProposalsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(proposals).where(eq(proposals.projectId, projectId)).orderBy(desc(proposals.createdAt));
}

export async function getPendingProposals(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(proposals)
    .where(and(eq(proposals.projectId, projectId), eq(proposals.status, "pending_review")))
    .orderBy(desc(proposals.createdAt));
}

export async function updateProposalStatus(
  proposalId: number,
  status: string,
  reviewedBy: number,
  feedback?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(proposals)
    .set({
      status: status as any,
      reviewedBy,
      reviewedAt: new Date(),
      feedback,
    })
    .where(eq(proposals.id, proposalId));
}

// Task operations
export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tasks).values(task);
  return result[0].insertId;
}

export async function getTasksByModule(moduleId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tasks).where(eq(tasks.moduleId, moduleId)).orderBy(desc(tasks.createdAt));
}

export async function getTasksByAgent(agentId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tasks).where(eq(tasks.assignedAgentId, agentId)).orderBy(desc(tasks.createdAt));
}

export async function updateTaskStatus(taskId: number, status: string, progressPercentage?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (progressPercentage !== undefined) {
    updateData.progressPercentage = progressPercentage;
  }
  if (status === "completed") {
    updateData.completedAt = new Date();
  }

  await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));
}

// Activity log operations
export async function logAgentActivity(log: InsertAgentActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(agentActivityLogs).values(log);
}

export async function getAgentActivityLogs(agentId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(agentActivityLogs)
    .where(eq(agentActivityLogs.agentId, agentId))
    .orderBy(desc(agentActivityLogs.timestamp))
    .limit(limit);
}

export async function getRecentActivityLogs(projectId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  // Get all agents for this project and their recent activity
  return db.select().from(agentActivityLogs).orderBy(desc(agentActivityLogs.timestamp)).limit(limit);
}

// Subsystem operations
export async function createSubsystem(subsystem: InsertSubsystem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(subsystems).values(subsystem);
  return result[0].insertId;
}

export async function getSubsystemsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(subsystems).where(eq(subsystems.projectId, projectId));
}

// Module operations
export async function createModule(module: InsertModule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(modules).values(module);
  return result[0].insertId;
}

export async function getModulesBySubsystem(subsystemId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(modules).where(eq(modules.subsystemId, subsystemId));
}

// Knowledge base operations
export async function addKnowledge(knowledge: InsertKnowledgeBase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(knowledgeBase).values(knowledge);
}

export async function getProjectKnowledge(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(knowledgeBase).where(eq(knowledgeBase.projectId, projectId));
}

// Approval operations
export async function createApproval(approval: InsertApproval) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(approvals).values(approval);
  return result[0].insertId;
}

// Deliverable operations
export async function createDeliverable(deliverable: InsertDeliverable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(deliverables).values(deliverable);
  return result[0].insertId;
}

export async function getDeliverablesByTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(deliverables).where(eq(deliverables.taskId, taskId));
}
