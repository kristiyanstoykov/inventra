'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function FlashToastHandler({ flash }: { flash?: { message: string; success: boolean } }) {
  useEffect(() => {
    if (flash) {
      if (flash.success) {
        toast.success(flash.message);
      } else {
        toast.error(flash.message);
      }
    }
  }, [flash]);

  return null;
}
