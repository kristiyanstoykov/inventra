'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { logOut } from '../actions';

export function LogOutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleLogOut}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? 'Logging Out...' : 'Log Out'}
    </Button>
  );
}
