import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Clock,
  CheckCircle,
  X,
  BarChart3,
  Download,
  AlertCircle
} from "lucide-react";

export default function ManagerDashboard() {
  const { toast } = useToast();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    retry: false,
  });

  // Fetch pending requests for approval
  const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/manager/pending-requests'],
    retry: false,
  });

  // Fetch department analytics
  const { data: departmentStats } = useQuery({
    queryKey: ['/api/analytics/departments'],
    retry: false,
  });

  // Fetch recent decisions
  const { data: recentDecisions } = useQuery({
    queryKey: ['/api/analytics/recent-decisions'],
    retry: false,
  });

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      await apiRequest('POST', `/api/manager/approve/${id}`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Swap request approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/recent-decisions'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      await apiRequest('POST', `/api/manager/reject/${id}`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Swap request rejected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/recent-decisions'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id });
  };

  const handleReject = (id: number) => {
    const reason = prompt("Please provide a reason for rejection (optional):");
    rejectMutation.mutate({ id, notes: reason || undefined });
  };

  const handleExportCSV = () => {
    window.open('/api/export/csv', '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-secondary/20 text-secondary';
      case 'rejected': return 'bg-destructive/20 text-destructive';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (statsLoading || requestsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Manager Dashboard</h2>
        <p className="text-muted-foreground">Review and approve shift swap requests</p>
      </div>

      {/* Manager Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold text-foreground">{stats?.pendingApprovals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Approved This Week</p>
                <p className="text-2xl font-bold text-foreground">{stats?.approvedWeek || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <X className="w-5 h-5 text-destructive" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rejected This Week</p>
                <p className="text-2xl font-bold text-foreground">{stats?.rejectedWeek || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Coverage Rate</p>
                <p className="text-2xl font-bold text-foreground">{stats?.coverageRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending Swap Requests</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests && pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Shift Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Volunteer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRequests.map((request: any) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {request.requester.profileImageUrl ? (
                            <img 
                              className="h-8 w-8 rounded-full object-cover" 
                              src={request.requester.profileImageUrl} 
                              alt={`${request.requester.firstName} profile`}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {request.requester.firstName?.[0] || 'U'}
                              </span>
                            </div>
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-foreground">
                              {request.requester.firstName} {request.requester.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{request.requester.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{formatDate(request.shift.date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(request.shift.startTime)} - {formatTime(request.shift.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.volunteer ? (
                          <div className="flex items-center">
                            {request.volunteer.profileImageUrl ? (
                              <img 
                                className="h-6 w-6 rounded-full object-cover" 
                                src={request.volunteer.profileImageUrl} 
                                alt={`${request.volunteer.firstName} profile`}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {request.volunteer.firstName?.[0] || 'U'}
                                </span>
                              </div>
                            )}
                            <span className="ml-2 text-sm text-foreground">
                              {request.volunteer.firstName} {request.volunteer.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No volunteer yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {request.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(request.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.volunteer ? (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-secondary hover:bg-secondary/90"
                              onClick={() => handleApprove(request.id)}
                              disabled={approveMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                              disabled={rejectMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Waiting for volunteer</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Department Swap Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentStats && departmentStats.length > 0 ? (
              <div className="space-y-4">
                {departmentStats.map((dept: any, index: number) => {
                  const colors = ['bg-primary', 'bg-secondary', 'bg-warning', 'bg-purple-500'];
                  const maxCount = Math.max(...departmentStats.map((d: any) => d.swapCount));
                  const percentage = maxCount > 0 ? (dept.swapCount / maxCount) * 100 : 0;
                  
                  return (
                    <div key={dept.department} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${colors[index % colors.length]} rounded-full`}></div>
                        <span className="text-sm text-foreground">{dept.department}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-foreground">{dept.swapCount} swaps</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${colors[index % colors.length]} h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No department data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Decisions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDecisions && recentDecisions.length > 0 ? (
              <div className="space-y-4">
                {recentDecisions.slice(0, 6).map((decision: any) => (
                  <div key={decision.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        decision.status === 'approved' ? 'bg-secondary/10' : 'bg-destructive/10'
                      }`}>
                        {decision.status === 'approved' ? (
                          <CheckCircle className="w-4 h-4 text-secondary" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium capitalize">{decision.status}</span> shift swap for{' '}
                        {decision.requester.firstName} {decision.requester.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(decision.shift.date)}, {formatTime(decision.shift.startTime)}-{formatTime(decision.shift.endTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(decision.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent decisions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
