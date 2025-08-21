import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfileDialog } from '@/components/auth/UserProfileDialog';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      navigate('/app/documents');
    }
  }, [open, navigate]);

  return (
    <UserProfileDialog open={open} onOpenChange={setOpen} />
  );
};

export default AccountPage;


