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
import { getMonthlyNewClientsLast6 } from '@/db/drizzle/queries/users';

export const description = 'A bar chart with a label';

const chartConfig = {
  count: {
    label: 'Count',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ClientNewUsersChart6Months({
  data,
  thisMonth,
  trendPct,
}: Awaited<ReturnType<typeof getMonthlyNewClientsLast6>>) {
  const chartData = data;

  return (
    <Card className="min-w-[150px] w-[350px] justify-around">
      <CardHeader>
        <CardTitle className="flex flex-row">New users</CardTitle>
        <CardDescription className="flex flex-row items-center">
          This month{' '}
          <span className="ms-1 flex flex-row items-center font-bold">{thisMonth} new users</span>
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
            <Bar dataKey="count" fill="var(--chart-3)" radius={8}>
              <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {trendPct === 0
            ? 'No change this month'
            : `Users ${trendPct > 0 ? 'up' : 'down'} by ${Math.abs(trendPct)}% this month`}
              <TrendingUp
                className={`h-4 w-4
                  ${
                    trendPct > 0
                    ? 'text-green-600'
                    : trendPct < 0
                    ? 'rotate-180 text-red-600'
                    : 'text-muted-foreground'
                  }`
                }
              />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total new user count for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
