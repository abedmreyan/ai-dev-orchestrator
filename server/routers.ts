import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { orchestrationRouter } from "./routers/orchestration";
import { attachmentsRouter } from "./routers/attachments";
import { taskExportRouter } from "./routers/taskExport";
import { googleTasksRouter } from "./routers/googleTasks";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Project management
  projects: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const project = await db.createProject({
          name: input.name,
          description: input.description,
          createdBy: ctx.user.id,
          status: "ideation",
        });
        return project;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProjectsByUser(ctx.user.id);
    }),

    getById: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return db.getProjectById(input.projectId);
    }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          status: z.enum(["ideation", "strategy_review", "design", "development", "testing", "deployed"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateProjectStatus(input.projectId, input.status);
        return { success: true };
      }),

    getSubsystems: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return db.getSubsystemsByProject(input.projectId);
    }),

    getKnowledge: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return db.getProjectKnowledge(input.projectId);
    }),
  }),

  // Proposal management
  proposals: router({
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          proposalType: z.enum(["strategy", "design", "task_assignment"]),
          title: z.string().min(1),
          content: z.string().min(1),
          createdBy: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const proposalId = await db.createProposal({
          ...input,
          status: "pending_review",
        });
        return { proposalId };
      }),

    listByProject: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return db.getProposalsByProject(input.projectId);
    }),

    getPending: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return db.getPendingProposals(input.projectId);
    }),

    approve: protectedProcedure
      .input(
        z.object({
          proposalId: z.number(),
          feedback: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateProposalStatus(input.proposalId, "approved", ctx.user.id, input.feedback);

        // Create approval record
        await db.createApproval({
          userId: ctx.user.id,
          entityType: "proposal",
          entityId: input.proposalId,
          status: "approved",
          comments: input.feedback,
        });

        return { success: true };
      }),

    reject: protectedProcedure
      .input(
        z.object({
          proposalId: z.number(),
          feedback: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateProposalStatus(input.proposalId, "rejected", ctx.user.id, input.feedback);

        // Create approval record
        await db.createApproval({
          userId: ctx.user.id,
          entityType: "proposal",
          entityId: input.proposalId,
          status: "rejected",
          comments: input.feedback,
        });

        return { success: true };
      }),
  }),

  // Agent management
  agents: router({
    list: protectedProcedure.query(async () => {
      return db.getAllAgents();
    }),

    getById: protectedProcedure.input(z.object({ agentId: z.number() })).query(async ({ input }) => {
      return db.getAgentById(input.agentId);
    }),

    getActivityLogs: protectedProcedure
      .input(
        z.object({
          agentId: z.number(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return db.getAgentActivityLogs(input.agentId, input.limit);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          agentId: z.number(),
          status: z.enum(["idle", "working", "blocked"]),
          currentTaskId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateAgentStatus(input.agentId, input.status, input.currentTaskId);
        return { success: true };
      }),
  }),

  // Task management
  tasks: router({
    create: protectedProcedure
      .input(
        z.object({
          moduleId: z.number(),
          title: z.string().min(1),
          description: z.string().min(1),
          requirements: z.string().min(1),
          assignedAgentId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const taskId = await db.createTask({
          ...input,
          status: "pending",
          progressPercentage: 0,
        });
        return { taskId };
      }),

    listByModule: protectedProcedure.input(z.object({ moduleId: z.number() })).query(async ({ input }) => {
      return db.getTasksByModule(input.moduleId);
    }),

    listByAgent: protectedProcedure.input(z.object({ agentId: z.number() })).query(async ({ input }) => {
      return db.getTasksByAgent(input.agentId);
    }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          status: z.enum(["pending", "assigned", "in_progress", "completed", "approved", "blocked"]),
          progressPercentage: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateTaskStatus(input.taskId, input.status, input.progressPercentage);
        return { success: true };
      }),

    approve: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          feedback: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateTaskStatus(input.taskId, "approved");

        // Create approval record
        await db.createApproval({
          userId: ctx.user.id,
          entityType: "task",
          entityId: input.taskId,
          status: "approved",
          comments: input.feedback,
        });

        return { success: true };
      }),

    getDeliverables: protectedProcedure.input(z.object({ taskId: z.number() })).query(async ({ input }) => {
      return db.getDeliverablesByTask(input.taskId);
    }),
  }),

  // Activity monitoring
  activity: router({
    logAction: protectedProcedure
      .input(
        z.object({
          agentId: z.number(),
          taskId: z.number().optional(),
          action: z.string().min(1),
          details: z.string().optional(),
          mcpToolCalled: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.logAgentActivity({
          agentId: input.agentId,
          taskId: input.taskId,
          action: input.action,
          details: input.details,
          mcpToolCalled: input.mcpToolCalled,
        });
        return { success: true };
      }),

    getRecent: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return db.getRecentActivityLogs(input.projectId, input.limit);
      }),
  }),

  // Orchestration
  orchestration: orchestrationRouter,

  // Attachments
  attachments: attachmentsRouter,

  // Knowledge base
  knowledge: router({
    add: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          key: z.string().min(1),
          value: z.string().min(1),
          source: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await db.addKnowledge(input);
        return { success: true };
      }),

    getByProject: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return db.getProjectKnowledge(input.projectId);
    }),
  }),

  // Task Export (NEW - for IDE agent handoff)
  taskExport: taskExportRouter,

  // Google Tasks Integration
  googleTasks: googleTasksRouter,
});

export type AppRouter = typeof appRouter;
