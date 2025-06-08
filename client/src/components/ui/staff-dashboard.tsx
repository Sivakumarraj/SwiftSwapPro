import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SwapRequestModal from "./swap-request-modal";
import {
  Calendar,
  ArrowRightLeft,
  CheckCircle,
  Users,
  Clock,
  AlertCircle
} from "lucide-react";

export default function StaffDashboard() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    retry: false,
  });

  // Fetch user shifts
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['/api/shifts'],
    retry: false,
  });

  // Fetch available swap requests
  const { data: availableSwaps, isLoading: swapsLoading } = useQuery({
    queryKey: ['/api/swap-requests/available'],
    retry: false,
  });

  // Fetch user's swap requests
  const { data: userRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/swap-requests'],
    retry: false,
  });

  // Fetch audit logs for recent activity
  const { data: auditLogs } = useQuery({
    queryKey: ['/api/audit-logs'],
    retry: false,
  });

  // Volunteer for shift mutation
  const volunteerMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest('POST', `/api/swap-requests/${requestId}/volunteer`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You've volunteered for this shift!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
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
        description: "Failed to volunteer for shift",
        variant: "destructive",
      });
    },
  });

  const handleVolunteer = (requestId: number) => {
    volunteerMutation.mutate(requestId);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 text-warning';
      case 'approved': return 'bg-secondary/20 text-secondary';
      case 'rejected': return 'bg-destructive/20 text-destructive';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-destructive/20 text-destructive';
      case 'urgent': return 'bg-warning/20 text-warning';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (statsLoading || shiftsLoading || swapsLoading || requestsLoading) {
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
        <h2 className="text-2xl font-bold text-foreground mb-2">My Shifts & Requests</h2>
        <p className="text-muted-foreground">Manage your scheduled shifts and post swap requests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Upcoming Shifts</p>
                <p className="text-2xl font-bold text-foreground">{stats?.upcomingShifts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-warning" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{stats?.pendingRequests || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Completed Swaps</p>
                <p className="text-2xl font-bold text-foreground">{stats?.completedSwaps || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Available Swaps</p>
                <p className="text-2xl font-bold text-foreground">{stats?.availableSwaps || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Shifts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Upcoming Shifts</CardTitle>
              <Button onClick={() => setShowModal(true)}>
                Request Swap
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {shifts && shifts.length > 0 ? (
              <div className="space-y-4">
                {shifts.map((shift: any) => {
                  const hasSwapRequest = userRequests?.some((req: any) => 
                    req.shiftId === shift.id && req.status === 'pending'
                  );
                  
                  return (
                    <div 
                      key={shift.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        hasSwapRequest ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              hasSwapRequest ? 'bg-warning/10' : 'bg-primary/10'
                            }`}>
                              <span className={`text-xs font-bold ${
                                hasSwapRequest ? 'text-warning' : 'text-primary'
                              }`}>
                                {formatDate(shift.date).split(' ')[0].toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {formatDate(shift.date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={hasSwapRequest ? getStatusColor('pending') : 'bg-blue-100 text-blue-800'}>
                          {hasSwapRequest ? 'Swap Requested' : 'Regular'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming shifts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Swap Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Available Swap Requests</CardTitle>
            <p className="text-sm text-muted-foreground">Help colleagues by taking their shifts</p>
          </CardHeader>
          <CardContent>
            {availableSwaps && availableSwaps.length > 0 ? (
              <div className="space-y-4">
                {availableSwaps.map((swap: any) => (
                  <div key={swap.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {swap.requester.profileImageUrl ? (
                          <img 
                            className="w-8 h-8 rounded-full object-cover" 
                            src={swap.requester.profileImageUrl} 
                            alt={`${swap.requester.firstName} profile`}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {swap.requester.firstName?.[0] || 'U'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {swap.requester.firstName} {swap.requester.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{swap.requester.department}</p>
                          <div className="mt-2">
                            <p className="text-sm text-foreground">
                              {formatDate(swap.shift.date)} • {formatTime(swap.shift.startTime)} - {formatTime(swap.shift.endTime)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">"{swap.reason}"</p>
                            {swap.priority !== 'normal' && (
                              <Badge className={`mt-1 ${getPriorityColor(swap.priority)}`}>
                                {swap.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-secondary hover:bg-secondary/90"
                        onClick={() => handleVolunteer(swap.id)}
                        disabled={volunteerMutation.isPending}
                      >
                        {volunteerMutation.isPending ? 'Volunteering...' : 'Volunteer'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No available swap requests</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-4">
              {auditLogs.slice(0, 5).map((log: any) => {
                const getIcon = (action: string) => {
                  switch (action) {
                    case 'swap_request_approved':
                    case 'swap_request_created':
                      return <CheckCircle className="w-4 h-4 text-secondary" />;
                    case 'volunteered_for_shift':
                      return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
                    case 'swap_request_rejected':
                      return <AlertCircle className="w-4 h-4 text-destructive" />;
                    default:
                      return <Clock className="w-4 h-4 text-muted-foreground" />;
                  }
                };

                const getActionText = (action: string) => {
                  switch (action) {
                    case 'swap_request_created': return 'Swap request created';
                    case 'swap_request_approved': return 'Swap approved';
                    case 'swap_request_rejected': return 'Swap rejected';
                    case 'volunteered_for_shift': return 'Volunteered for shift';
                    default: return action.replace(/_/g, ' ');
                  }
                };

                return (
                  <div key={log.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                        {getIcon(log.action)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{getActionText(log.action)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swap Request Modal */}
      {showModal && (
        <SwapRequestModal 
          shifts={shifts || []}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
            queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
          }}
        />
      )}
    </div>
  );
}
