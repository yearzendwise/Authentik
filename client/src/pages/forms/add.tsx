import { FormWizard } from '@/components/form-builder/form-wizard';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useAuth } from '@/hooks/useAuth';

export default function AddForm() {
  const { isAuthenticated, isLoading: authLoading } = useReduxAuth();
  const { hasInitialized } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect unauthenticated users immediately
  if (hasInitialized && !isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  // Show loading while authentication is being determined
  if (!hasInitialized || authLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-4">Authenticating...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <FormWizard />
    </div>
  );
}