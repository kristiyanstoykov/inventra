'use client';

import { Banknote, CreditCard, TrendingUp } from 'lucide-react';
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
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ClientPaymentsPieChart({ data }: { data: PaymentUsagePoint[] }) {
  const cashColor = data.find((d) => d.paymentType === 'cash')?.fill || '';
  const cashUsage = data.find((d) => d.paymentType === 'cash')?.usage || 0;
  const cardColor = data.find((d) => d.paymentType === 'card')?.fill || '';
  const cardUsage = data.find((d) => d.paymentType === 'card')?.usage || 0;

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
            <Pie
              data={data.filter((d) => d.usage !== 0)}
              dataKey="usage"
            >
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
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full mt-1 shrink-0"
            style={{ backgroundColor: cashColor }}
          />
          <Banknote className="h-4 w-4" />
          {cashUsage} cash {cashUsage > 1 ? 'payments' : 'payment'}
        </div>
        <div className="flex gap-2 leading-none font-medium">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full mt-1 shrink-0"
            style={{ backgroundColor: cardColor }}
          />
          <CreditCard className="h-4 w-4" />
          {cardUsage} card {cardUsage > 1 ? 'payments' : 'payment'}
        </div>
      </CardFooter>
    </Card>
  );
}
