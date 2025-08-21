import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component is now deprecated in favor of AuthInviteFlow
// Redirect to the new enhanced invitation flow
const CompleteInvite: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new enhanced invitation flow
    navigate('/auth/complete-invite', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default CompleteInvite;
