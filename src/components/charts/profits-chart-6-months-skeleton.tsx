'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

export const description = 'Loading skeleton for the 6-month profits chart';

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function SkeletonProfitsChart6Months() {
  const barHeights = [0.7, 0.95, 0.8, 0.35, 0.78, 0.82];

  return (
    <Card aria-busy aria-live="polite">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-40" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-32" />
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Keep same footprint as the chart by reusing ChartContainer */}
        <ChartContainer config={chartConfig} className="w-[150px] h-[150px]">
          <div className="h-full w-full px-6 pt-4 pb-8">
            {/* Grid lines */}
            <div className="relative h-full w-full">
              <div className="absolute inset-0 grid grid-rows-4">
                <div className="border-b border-muted/40" />
                <div className="border-b border-muted/40" />
                <div className="border-b border-muted/40" />
                <div className="" />
              </div>

              {/* Bars */}
              <div className="relative h-full w-full flex items-end gap-4">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <Skeleton className="w-full rounded-md" style={{ height: `${h * 100}%` }} />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-64" />
      </CardFooter>
    </Card>
  );
}
