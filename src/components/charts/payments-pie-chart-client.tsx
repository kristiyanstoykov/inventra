'use client';

import { TrendingUp } from 'lucide-react';
import { LabelList, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PaymentUsagePoint } from '@/db/drizzle/queries/orders';

export const description = 'A pie chart with a label list';

const chartConfig = {
  usage: {
    label: 'Usage',
  },
  cash: {
    label: 'Cash',
    color: 'var(--primary)',
  },
  card: {
    label: 'Card',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export function ClientPaymentsPieChart({ data }: { data: PaymentUsagePoint[] }) {
  return (
    <Card className="flex flex-col min-w-[150px] w-[350px] justify-around">
      <CardHeader className="items-center pb-0">
        <CardTitle>Payment methods usage</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="usage" hideLabel />} />
            <Pie data={data} dataKey="usage">
              <LabelList
                dataKey="paymentType"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value: keyof typeof chartConfig) => chartConfig[value]?.label}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total usage for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
