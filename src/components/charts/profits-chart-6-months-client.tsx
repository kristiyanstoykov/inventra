'use client';

import { Euro, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { getMonthlyRevenueProfitLast6 } from '@/db/drizzle/queries/orders';
import { Separator } from '../ui/separator';

export const description = 'A bar chart with a label';

const chartConfig = {
  profit: {
    label: 'Profit',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ClientProfitsChart6Months({
  data,
  thisMonth,
  trendPct,
}: Awaited<ReturnType<typeof getMonthlyRevenueProfitLast6>>) {
  const chartData = data;

  return (
    <Card className="min-w-[150px] w-[350px] justify-around">
      <CardHeader>
        <CardTitle className="flex flex-row">Profits</CardTitle>
        <CardDescription className="flex flex-row items-center">
          This month{' '}
          <span className="ms-1 flex flex-row items-center font-bold">
            <Euro className="h-3 w-3" />
            {thisMonth}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="profit" fill="var(--primary)" radius={8}>
              <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by {trendPct}% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total profits for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
