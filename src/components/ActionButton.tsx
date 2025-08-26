'use client';

import { ComponentPropsWithRef, useTransition } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { LoadingSwap } from './LoadingSwap';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@radix-ui/react-alert-dialog';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from './ui/alert-dialog';

export function ActionButton({
  action,
  requireAreYouSure = false,
  areYouSureDescription = 'This action cannot be undone.',
  router,
  routerRefresh = true,
  ...props
}: Omit<ComponentPropsWithRef<typeof Button>, 'onClick'> & {
  action: () => Promise<{ error: boolean; message?: string }>;
  requireAreYouSure?: boolean;
  areYouSureDescription?: string;
  router?: { refresh: () => void };
  routerRefresh?: boolean;
}) {
  const [isLoading, startTransition] = useTransition();

  function performAction() {
    startTransition(async () => {
      const data = await action();

      if (data.error) {
        toast.error(data.message ?? 'Error');
      } else if (data instanceof Error) {
        toast.error(data.message);
      } else if (data.message) {
        toast.success(data.message);
      }

      if (routerRefresh && router) {
        router.refresh();
      }
    });
  }

  if (requireAreYouSure) {
    return (
      <AlertDialog open={isLoading ? true : undefined}>
        <AlertDialogTrigger asChild>
          <Button {...props} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>{areYouSureDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={performAction}>
              <LoadingSwap isLoading={isLoading}>Yes</LoadingSwap>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Button {...props} disabled={isLoading} onClick={performAction}>
      <LoadingSwap isLoading={isLoading} className="inline-flex items-center gap-2">
        {props.children}
      </LoadingSwap>
    </Button>
  );
}
