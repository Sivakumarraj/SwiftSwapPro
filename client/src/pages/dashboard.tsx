import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/ui/navigation";
import StaffDashboard from "@/components/ui/staff-dashboard";
import ManagerDashboard from "@/components/ui/manager-dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<'staff' | 'manager'>('staff');

  // If user is a manager, they can switch between views
  const canSwitchRoles = user?.role === 'manager';

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole}
        canSwitchRoles={canSwitchRoles}
        user={user}
      />
      
      {currentRole === 'staff' ? (
        <StaffDashboard />
      ) : (
        <ManagerDashboard />
      )}
    </div>
  );
}
