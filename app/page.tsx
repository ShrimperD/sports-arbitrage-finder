'use client';

import { useState, useEffect } from 'react';
import { useOdds, useArbitrageOpportunities } from '@/hooks/use-odds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sport } from '@/lib/services/odds-api';
import { ArbitrageControls, type ArbitrageSettings } from '@/components/features/ArbitrageControls';
import { ArbitrageHistory, type HistoricalOpportunity } from '@/components/features/ArbitrageHistory';
import { NotificationService } from '@/lib/services/notification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Bet = {
  team: string;
  odds: number;
  bookmaker: string;
  stake: number;
};

type Opportunity = {
  homeTeam: string;
  awayTeam: string;
  opportunity: {
    totalReturn: number;
    bets: Array<Bet>;
  } | null;
};

const defaultSettings: ArbitrageSettings = {
  minReturn: 0.5,
  maxStake: 1000,
  sortBy: 'return',
  sortOrder: 'desc',
  autoRefresh: true,
  refreshInterval: 60,
  notificationsEnabled: false,
  minReturnForNotification: 1.0,
};

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<string>();
  const [settings, setSettings] = useState<ArbitrageSettings>(defaultSettings);
  const [history, setHistory] = useState<HistoricalOpportunity[]>([]);
  const { sports, loading: sportsLoading } = useOdds();
  const { opportunities, loading: oddsLoading } = useArbitrageOpportunities(selectedSport);

  const loading = sportsLoading || oddsLoading;
  const notificationService = NotificationService.getInstance();

  // Apply filters and sorting
  const filteredOpportunities = opportunities
    .filter((o: Opportunity) => {
      if (!o.opportunity) return false;
      return o.opportunity.totalReturn >= settings.minReturn;
    })
    .sort((a: Opportunity, b: Opportunity) => {
      if (!a.opportunity || !b.opportunity) return 0;
      const multiplier = settings.sortOrder === 'desc' ? -1 : 1;
      
      switch (settings.sortBy) {
        case 'return':
          return (a.opportunity.totalReturn - b.opportunity.totalReturn) * multiplier;
        case 'risk':
          return (
            (Math.max(...a.opportunity.bets.map(b => b.odds)) -
              Math.max(...b.opportunity.bets.map(b => b.odds))) *
            multiplier
          );
        case 'time':
          // This would need the event time from the API
          return 0;
        default:
          return 0;
      }
    });

  // Handle notifications
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const newOpportunities = filteredOpportunities.filter(
      (o: Opportunity) =>
        o.opportunity &&
        o.opportunity.totalReturn >= settings.minReturnForNotification &&
        !history.some(
          (h) =>
            h.homeTeam === o.homeTeam &&
            h.awayTeam === o.awayTeam &&
            Math.abs(h.return - o.opportunity!.totalReturn) < 0.1
        )
    );

    newOpportunities.forEach((o: Opportunity) => {
      notificationService.notifyArbitrageOpportunity(
        o.homeTeam,
        o.awayTeam,
        o.opportunity!.totalReturn,
        o.opportunity!.bets.map((b) => b.bookmaker)
      );

      setHistory((prev) => [
        {
          timestamp: new Date().toISOString(),
          return: o.opportunity!.totalReturn,
          homeTeam: o.homeTeam,
          awayTeam: o.awayTeam,
          bookmakers: o.opportunity!.bets.map((b) => b.bookmaker),
          successful: true,
        },
        ...prev,
      ]);
    });
  }, [filteredOpportunities, settings.notificationsEnabled, settings.minReturnForNotification]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Arbitrage Opportunities</h2>
        <p className="text-muted-foreground">
          Track and analyze real-time betting opportunities across multiple bookmakers.
        </p>
      </div>

      <div className="flex gap-4 flex-col">
        <div className="grid gap-4 md:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Sport</CardTitle>
                <CardDescription>Choose a sport to view arbitrage opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedSport}
                  onValueChange={setSelectedSport}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sport..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport: Sport) => (
                      <SelectItem key={sport.key} value={sport.key}>
                        {sport.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <ArbitrageControls
              settings={settings}
              onSettingsChange={setSettings}
            />
          </div>

          <Tabs defaultValue="opportunities">
            <TabsList>
              <TabsTrigger value="opportunities">Live Opportunities</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {filteredOpportunities.length}
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
                        {filteredOpportunities
                          .reduce(
                            (max, curr) =>
                              Math.max(max, curr.opportunity?.totalReturn || 0),
                            0
                          )
                          .toFixed(2)}
                        %
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
                        {(
                          filteredOpportunities.reduce(
                            (sum, curr) => sum + (curr.opportunity?.totalReturn || 0),
                            0
                          ) / filteredOpportunities.length || 0
                        ).toFixed(2)}
                        %
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Potential
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">
                        $
                        {filteredOpportunities
                          .reduce(
                            (sum, curr) =>
                              sum +
                              (curr.opportunity
                                ? (curr.opportunity.totalReturn * settings.maxStake) / 100
                                : 0),
                            0
                          )
                          .toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Live Opportunities</CardTitle>
                    <CardDescription>
                      Current arbitrage opportunities for {selectedSport}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        {filteredOpportunities.map((opp: Opportunity, idx: number) => (
                          <Card key={idx}>
                            <CardHeader>
                              <CardTitle className="text-lg">
                                {opp.homeTeam} vs {opp.awayTeam}
                              </CardTitle>
                              <CardDescription>
                                Expected Return:{' '}
                                {((opp.opportunity?.totalReturn || 0) - 1000).toFixed(2)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {opp.opportunity?.bets.map((bet: Bet, betIdx: number) => (
                                  <div
                                    key={betIdx}
                                    className="flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="font-medium">{bet.team}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {bet.bookmaker}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">
                                        Stake: ${bet.stake.toFixed(2)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Odds: {bet.odds}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {filteredOpportunities.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No arbitrage opportunities found for the selected sport.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ArbitrageHistory history={history} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}