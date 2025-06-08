import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";

interface NavigationProps {
  currentRole: 'staff' | 'manager';
  setCurrentRole: (role: 'staff' | 'manager') => void;
  canSwitchRoles: boolean;
  user: User | undefined;
}

export default function Navigation({ currentRole, setCurrentRole, canSwitchRoles, user }: NavigationProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">ShiftFlow</h1>
            </div>
            {/* Role Switcher - only show if user is manager */}
            {canSwitchRoles && (
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Button
                    variant={currentRole === 'staff' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentRole('staff')}
                    className={currentRole === 'staff' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}
                  >
                    Staff View
                  </Button>
                  <Button
                    variant={currentRole === 'manager' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentRole('manager')}
                    className={currentRole === 'manager' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}
                  >
                    Manager View
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </Button>
            <div className="relative">
              {user?.profileImageUrl ? (
                <img 
                  className="h-8 w-8 rounded-full object-cover" 
                  src={user.profileImageUrl} 
                  alt="User profile"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
