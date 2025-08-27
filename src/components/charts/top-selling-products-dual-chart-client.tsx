'use client';

import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { useEffect, useState, useTransition } from 'react';
import { TopItemSnapshot } from '@/db/drizzle/queries/orderItems';
import { getTopProductsThisMonthSnapshotAction } from '@/lib/actions/orderItems';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SkeletonChart6Months } from './chart-6-months-skeleton';

type Metric = 'quantity' | 'revenue';

// Define color palette for bars + legend squares
const BAR_COLORS = [
  '#f98015', // amber
  '#10b981', // green
  'var(--chart-3)', // blue
  '#ef4444', // red
  '#8b5cf6', // purple
];
const chartConfig = {
  qty: { label: 'qty', color: 'var(--chart-2)' },
  revenue: { label: 'revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig;

// Custom tooltip shows BOTH qty and revenue
function TopProductsTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as
    | { productId: number; qty: number; revenue: number }
    | undefined;
  if (!row) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-medium">#{row.productId}</div>
      <div className="text-muted-foreground">
        Qty: <span className="tabular-nums">{row.qty}</span>
      </div>
      <div className="text-muted-foreground">
        Revenue: <span className="tabular-nums">{row.revenue?.toFixed?.(2) ?? row.revenue}</span>
      </div>
    </div>
  );
}

export function ClientTopSellingProductsDualChart() {
  const [metric, setMetric] = useState<Metric>('quantity');
  const [data, setData] = useState<TopItemSnapshot[]>([]);
  const [isPending, startTransition] = useTransition();

  // Initial load
  useEffect(() => {
    startTransition(async () => {
      const result = await getTopProductsThisMonthSnapshotAction(metric, 5);
      setData(result);
    });
  }, [metric]);

  // Handle toggle
  const handleMetricChange = (value: string) => {
    if (!value || value === metric) return;
    setMetric(value as Metric);

    startTransition(async () => {
      const result = await getTopProductsThisMonthSnapshotAction(value as Metric, 5);
      setData(result);
    });
  };

  const chartData = data.map((d, i) => ({
    ...d,
    idName: `#${d.productId}`,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const barKey = metric === 'quantity' ? ('qty' as const) : ('revenue' as const);
  const barName = metric === 'quantity' ? 'Quantity' : 'Revenue';
  const desc = metric === 'quantity' ? 'By quantity' : 'By revenue';

  return (
    <>
      {isPending ? (
        <SkeletonChart6Months />
      ) : (
        <Card className="min-w-[150px] w-[350px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <ToggleGroup
                type="single"
                value={metric}
                onValueChange={handleMetricChange}
                className="justify-end"
              >
                <ToggleGroupItem value="quantity" aria-label="By quantity">
                  Quantity
                </ToggleGroupItem>
                <ToggleGroupItem value="revenue" aria-label="By revenue">
                  Revenue
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <CardTitle>Top selling products this month</CardTitle>
            <CardDescription>{desc}</CardDescription>
          </CardHeader>

          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="idName" tickLine={false} tickMargin={10} axisLine={false} />
                <Tooltip cursor={false} content={<TopProductsTooltip />} />
                <Bar dataKey={barKey} name={barName} radius={4}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>

          <CardFooter className="flex-col items-start gap-2 text-sm">
            <ol className="text-[0.8rem] list-none m-0 p-0 w-full space-y-2">
              {chartData.map((item) => (
                <li key={item.productId}>
                  <div className="flex items-start gap-2">
                    {/* DOT — fixed square, never shrinks */}
                    <span
                      aria-hidden
                      className="mt-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-background
                 shrink-0 flex-none"
                      style={{ backgroundColor: item.fill }}
                    />
                    {/* ID (fixed width) */}
                    <span className="tabular-nums font-medium w-12 shrink-0">
                      #{item.productId}
                    </span>
                    {/* NAME (wrap freely) */}
                    <span className="leading-snug break-words whitespace-normal">{item.name}</span>
                  </div>
                </li>
              ))}
            </ol>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
