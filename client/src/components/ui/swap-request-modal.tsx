import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

interface SwapRequestModalProps {
  shifts: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SwapRequestModal({ shifts, onClose, onSuccess }: SwapRequestModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    shiftId: '',
    reason: '',
    priority: 'normal'
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/swap-requests', {
        shiftId: parseInt(data.shiftId),
        reason: data.reason,
        priority: data.priority
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Swap request submitted successfully!",
      });
      onSuccess();
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
        description: "Failed to submit swap request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.shiftId || !formData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please select a shift and provide a reason",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(formData);
  };

  const formatShiftOption = (shift: any) => {
    const date = new Date(shift.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    const startTime = new Date(`2000-01-01T${shift.startTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTime = new Date(`2000-01-01T${shift.endTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${date} • ${startTime} - ${endTime}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Request Shift Swap</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="shift">Select Shift to Swap</Label>
              <Select
                value={formData.shiftId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, shiftId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a shift..." />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id.toString()}>
                      {formatShiftOption(shift)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Swap</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a brief reason for your swap request..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
