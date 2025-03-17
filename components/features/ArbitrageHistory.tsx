import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export type HistoricalOpportunity = {
  timestamp: string;
  return: number;
  homeTeam: string;
  awayTeam: string;
  bookmakers: string[];
  successful: boolean;
};

type ArbitrageHistoryProps = {
  history: HistoricalOpportunity[];
};

export function ArbitrageHistory({ history }: ArbitrageHistoryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');

  const chartData = history.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString(),
    return: h.return,
  }));

  const stats = {
    totalOpportunities: history.length,
    successfulOpportunities: history.filter((h) => h.successful).length,
    averageReturn: history.reduce((acc, h) => acc + h.return, 0) / history.length || 0,
    bestReturn: Math.max(...history.map((h) => h.return)),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historical Performance</CardTitle>
          <CardDescription>Track your arbitrage opportunity history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="return"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOpportunities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.successfulOpportunities / stats.totalOpportunities) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.averageReturn.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.bestReturn.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent History</CardTitle>
          <CardDescription>Your latest arbitrage opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {history.map((opportunity, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {opportunity.homeTeam} vs {opportunity.awayTeam}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(opportunity.timestamp).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {opportunity.bookmakers.join(' • ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${opportunity.successful ? 'text-green-500' : 'text-red-500'}`}>
                          {opportunity.return.toFixed(2)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {opportunity.successful ? 'Successful' : 'Missed'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 