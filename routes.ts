import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertShiftSchema, insertSwapRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  try {
    await setupAuth(app);
  } catch (error) {
    console.error('Auth setup error:', error);
    // Continue with limited functionality
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userShifts = await storage.getUserShifts(userId);
      const userSwapRequests = await storage.getUserSwapRequests(userId);
      const availableSwaps = await storage.getAvailableSwapRequests(userId);
      
      const pendingRequests = userSwapRequests.filter(req => req.status === 'pending').length;
      const completedSwaps = userSwapRequests.filter(req => req.status === 'approved').length;

      let managerStats = {};
      if (user.role === 'manager') {
        const pendingApprovals = await storage.getPendingSwapRequests();
        const recentDecisions = await storage.getRecentDecisions();
        const departmentStats = await storage.getDepartmentStats();
        
        const thisWeekApproved = recentDecisions.filter(d => 
          d.status === 'approved' && 
          new Date(d.updatedAt!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length;
        
        const thisWeekRejected = recentDecisions.filter(d => 
          d.status === 'rejected' && 
          new Date(d.updatedAt!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length;

        managerStats = {
          pendingApprovals: pendingApprovals.length,
          approvedWeek: thisWeekApproved,
          rejectedWeek: thisWeekRejected,
          coverageRate: 94 // This would be calculated based on actual data
        };
      }

      res.json({
        upcomingShifts: userShifts.length,
        pendingRequests,
        completedSwaps,
        availableSwaps: availableSwaps.length,
        ...managerStats
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Shifts routes
  app.get('/api/shifts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shifts = await storage.getUserShifts(userId);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.post('/api/shifts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shiftData = insertShiftSchema.parse({ ...req.body, userId });
      
      const shift = await storage.createShift(shiftData);
      
      await storage.createAuditLog({
        action: "shift_created",
        entityType: "shift",
        entityId: shift.id.toString(),
        userId,
        details: { date: shift.date, startTime: shift.startTime, endTime: shift.endTime }
      });
      
      res.json(shift);
    } catch (error) {
      console.error("Error creating shift:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shift data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  // Swap requests routes
  app.get('/api/swap-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getUserSwapRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  app.post('/api/swap-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = insertSwapRequestSchema.parse({ ...req.body, requesterId: userId });
      
      const request = await storage.createSwapRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating swap request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create swap request" });
    }
  });

  app.get('/api/swap-requests/available', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getAvailableSwapRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching available swap requests:", error);
      res.status(500).json({ message: "Failed to fetch available swap requests" });
    }
  });

  app.post('/api/swap-requests/:id/volunteer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      
      const request = await storage.volunteerForShift(requestId, userId);
      res.json(request);
    } catch (error) {
      console.error("Error volunteering for shift:", error);
      res.status(500).json({ message: "Failed to volunteer for shift" });
    }
  });

  // Manager routes
  app.get('/api/manager/pending-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Manager access required" });
      }
      
      const requests = await storage.getSwapRequestsForApproval();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  app.post('/api/manager/approve/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Manager access required" });
      }
      
      const requestId = parseInt(req.params.id);
      const { notes } = req.body;
      
      const request = await storage.approveSwapRequest(requestId, userId, notes);
      res.json(request);
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ message: "Failed to approve request" });
    }
  });

  app.post('/api/manager/reject/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Manager access required" });
      }
      
      const requestId = parseInt(req.params.id);
      const { notes } = req.body;
      
      const request = await storage.rejectSwapRequest(requestId, userId, notes);
      res.json(request);
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ message: "Failed to reject request" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/departments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Manager access required" });
      }
      
      const stats = await storage.getDepartmentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching department stats:", error);
      res.status(500).json({ message: "Failed to fetch department stats" });
    }
  });

  app.get('/api/analytics/recent-decisions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Manager access required" });
      }
      
      const decisions = await storage.getRecentDecisions();
      res.json(decisions);
    } catch (error) {
      console.error("Error fetching recent decisions:", error);
      res.status(500).json({ message: "Failed to fetch recent decisions" });
    }
  });

  // Export routes
  app.get('/api/export/csv', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Manager access required" });
      }
      
      const decisions = await storage.getRecentDecisions();
      
      // Create CSV content
      const csvHeaders = 'Date,Requester,Shift Date,Shift Time,Status,Notes\n';
      const csvRows = decisions.map(d => 
        `${new Date(d.updatedAt!).toLocaleDateString()},${d.requester.firstName} ${d.requester.lastName},${d.shift.date},${d.shift.startTime}-${d.shift.endTime},${d.status},"${d.managerNotes || ''}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=swap-requests-export.csv');
      res.send(csvHeaders + csvRows);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // Audit trail routes
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getUserAuditLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
