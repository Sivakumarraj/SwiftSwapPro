import {
  users,
  shifts,
  swapRequests,
  auditLogs,
  type User,
  type UpsertUser,
  type Shift,
  type InsertShift,
  type SwapRequest,
  type InsertSwapRequest,
  type InsertAuditLog,
  type AuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Shift operations
  getUserShifts(userId: string): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  getShiftById(id: number): Promise<Shift | undefined>;
  
  // Swap request operations
  createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest>;
  getUserSwapRequests(userId: string): Promise<SwapRequest[]>;
  getAvailableSwapRequests(userId: string): Promise<any[]>;
  getPendingSwapRequests(): Promise<any[]>;
  updateSwapRequest(id: number, updates: Partial<SwapRequest>): Promise<SwapRequest>;
  volunteerForShift(requestId: number, volunteerId: string): Promise<SwapRequest>;
  
  // Manager operations
  getSwapRequestsForApproval(): Promise<any[]>;
  approveSwapRequest(requestId: number, approverId: string, notes?: string): Promise<SwapRequest>;
  rejectSwapRequest(requestId: number, approverId: string, notes?: string): Promise<SwapRequest>;
  
  // Analytics
  getDepartmentStats(): Promise<any[]>;
  getRecentDecisions(): Promise<any[]>;
  
  // Audit trail
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getUserAuditLogs(userId: string): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Shift operations
  async getUserShifts(userId: string): Promise<Shift[]> {
    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(shifts.date, shifts.startTime);
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [newShift] = await db.insert(shifts).values(shift).returning();
    return newShift;
  }

  async getShiftById(id: number): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift;
  }

  // Swap request operations
  async createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest> {
    const [newRequest] = await db.insert(swapRequests).values(request).returning();
    
    // Create audit log
    await this.createAuditLog({
      action: "swap_request_created",
      entityType: "swap_request",
      entityId: newRequest.id.toString(),
      userId: request.requesterId,
      details: { reason: request.reason, priority: request.priority }
    });
    
    return newRequest;
  }

  async getUserSwapRequests(userId: string): Promise<SwapRequest[]> {
    return await db
      .select()
      .from(swapRequests)
      .where(eq(swapRequests.requesterId, userId))
      .orderBy(desc(swapRequests.createdAt));
  }

  async getAvailableSwapRequests(userId: string): Promise<any[]> {
    const result = await db
      .select({
        id: swapRequests.id,
        reason: swapRequests.reason,
        priority: swapRequests.priority,
        status: swapRequests.status,
        createdAt: swapRequests.createdAt,
        shift: {
          date: shifts.date,
          startTime: shifts.startTime,
          endTime: shifts.endTime,
          department: shifts.department,
        },
        requester: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          department: users.department,
        }
      })
      .from(swapRequests)
      .innerJoin(shifts, eq(swapRequests.shiftId, shifts.id))
      .innerJoin(users, eq(swapRequests.requesterId, users.id))
      .where(
        and(
          eq(swapRequests.status, "pending"),
          sql`${swapRequests.requesterId} != ${userId}`,
          sql`${swapRequests.volunteerId} IS NULL`
        )
      )
      .orderBy(desc(swapRequests.createdAt));
    
    return result;
  }

  async getPendingSwapRequests(): Promise<any[]> {
    const result = await db
      .select({
        id: swapRequests.id,
        reason: swapRequests.reason,
        priority: swapRequests.priority,
        status: swapRequests.status,
        createdAt: swapRequests.createdAt,
        shift: {
          date: shifts.date,
          startTime: shifts.startTime,
          endTime: shifts.endTime,
          department: shifts.department,
        },
        requester: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          department: users.department,
        }
      })
      .from(swapRequests)
      .innerJoin(shifts, eq(swapRequests.shiftId, shifts.id))
      .innerJoin(users, eq(swapRequests.requesterId, users.id))
      .where(eq(swapRequests.status, "pending"))
      .orderBy(desc(swapRequests.createdAt));
    
    return result;
  }

  async updateSwapRequest(id: number, updates: Partial<SwapRequest>): Promise<SwapRequest> {
    const [updated] = await db
      .update(swapRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(swapRequests.id, id))
      .returning();
    
    return updated;
  }

  async volunteerForShift(requestId: number, volunteerId: string): Promise<SwapRequest> {
    const [updated] = await db
      .update(swapRequests)
      .set({ 
        volunteerId,
        updatedAt: new Date()
      })
      .where(eq(swapRequests.id, requestId))
      .returning();

    // Create audit log
    await this.createAuditLog({
      action: "volunteered_for_shift",
      entityType: "swap_request",
      entityId: requestId.toString(),
      userId: volunteerId,
      details: { requestId }
    });

    return updated;
  }

  // Manager operations
  async getSwapRequestsForApproval(): Promise<any[]> {
    const result = await db
      .select({
        id: swapRequests.id,
        reason: swapRequests.reason,
        priority: swapRequests.priority,
        status: swapRequests.status,
        createdAt: swapRequests.createdAt,
        volunteerId: swapRequests.volunteerId,
        shift: {
          date: shifts.date,
          startTime: shifts.startTime,
          endTime: shifts.endTime,
          department: shifts.department,
        },
        requester: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          department: users.department,
        }
      })
      .from(swapRequests)
      .innerJoin(shifts, eq(swapRequests.shiftId, shifts.id))
      .innerJoin(users, eq(swapRequests.requesterId, users.id))
      .where(eq(swapRequests.status, "pending"))
      .orderBy(desc(swapRequests.createdAt));

    // Get volunteer info for requests that have volunteers
    const withVolunteers = await Promise.all(
      result.map(async (req) => {
        if (req.volunteerId) {
          const volunteer = await this.getUser(req.volunteerId);
          return {
            ...req,
            volunteer: volunteer ? {
              firstName: volunteer.firstName,
              lastName: volunteer.lastName,
              profileImageUrl: volunteer.profileImageUrl,
              department: volunteer.department,
            } : null
          };
        }
        return { ...req, volunteer: null };
      })
    );

    return withVolunteers;
  }

  async approveSwapRequest(requestId: number, approverId: string, notes?: string): Promise<SwapRequest> {
    const [updated] = await db
      .update(swapRequests)
      .set({
        status: "approved",
        approvedBy: approverId,
        managerNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(swapRequests.id, requestId))
      .returning();

    // Create audit log
    await this.createAuditLog({
      action: "swap_request_approved",
      entityType: "swap_request",
      entityId: requestId.toString(),
      userId: approverId,
      details: { notes }
    });

    return updated;
  }

  async rejectSwapRequest(requestId: number, approverId: string, notes?: string): Promise<SwapRequest> {
    const [updated] = await db
      .update(swapRequests)
      .set({
        status: "rejected",
        approvedBy: approverId,
        managerNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(swapRequests.id, requestId))
      .returning();

    // Create audit log
    await this.createAuditLog({
      action: "swap_request_rejected",
      entityType: "swap_request",
      entityId: requestId.toString(),
      userId: approverId,
      details: { notes }
    });

    return updated;
  }

  // Analytics
  async getDepartmentStats(): Promise<any[]> {
    const result = await db
      .select({
        department: shifts.department,
        swapCount: sql<number>`count(${swapRequests.id})`.as('swapCount')
      })
      .from(shifts)
      .leftJoin(swapRequests, eq(shifts.id, swapRequests.shiftId))
      .groupBy(shifts.department)
      .orderBy(sql`count(${swapRequests.id}) desc`);

    return result;
  }

  async getRecentDecisions(): Promise<any[]> {
    const result = await db
      .select({
        id: swapRequests.id,
        status: swapRequests.status,
        managerNotes: swapRequests.managerNotes,
        updatedAt: swapRequests.updatedAt,
        shift: {
          date: shifts.date,
          startTime: shifts.startTime,
          endTime: shifts.endTime,
        },
        requester: {
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(swapRequests)
      .innerJoin(shifts, eq(swapRequests.shiftId, shifts.id))
      .innerJoin(users, eq(swapRequests.requesterId, users.id))
      .where(or(eq(swapRequests.status, "approved"), eq(swapRequests.status, "rejected")))
      .orderBy(desc(swapRequests.updatedAt))
      .limit(10);

    return result;
  }

  // Audit trail
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getUserAuditLogs(userId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);
  }
}

export const storage = new DatabaseStorage();
