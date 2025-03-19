'use client';

import { useState, useEffect } from 'react';
import { useSports, useArbitrageOpportunities } from '@/hooks/use-odds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sport } from '@/lib/services/odds-api';
import { ArbitrageControls, type ArbitrageSettings } from '@/components/features/ArbitrageControls';
import { ArbitrageHistory, type HistoricalOpportunity } from '@/components/features/ArbitrageHistory';
import { NotificationService } from '@/lib/services/notification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpportunityCard } from '@/components/features/OpportunityCard';
import { BettingTable } from '@/components/features/BettingTable';
import { Checkbox } from '@/components/ui/checkbox';

type Bet = {
  team: string;
  odds: number;
  bookmaker: string;
  stake: number;
};

type Opportunity = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  commenceTime: string;
  return: number;
  bets: Array<Bet>;
  isBetPlaced?: boolean;
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
  oddsApi: true,
  rapidApi: true,
  selectedBookmakers: [],
};

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [settings, setSettings] = useState<ArbitrageSettings>(defaultSettings);
  const [history, setHistory] = useState<HistoricalOpportunity[]>([]);
  const [betOpportunities, setBetOpportunities] = useState<Set<string>>(new Set());
  const { sports, loading: sportsLoading } = useSports();
  const { opportunities, loading: oddsLoading } = useArbitrageOpportunities(selectedSport);

  const loading = sportsLoading || oddsLoading;
  const notificationService = NotificationService.getInstance();

  // Extract unique bookmakers from opportunities
  const availableBookmakers = Array.from(
    new Set(
      opportunities.flatMap(opp => opp.bets.map(bet => bet.bookmaker))
    )
  ).sort();

  // Transform API opportunities into our format
  const transformedOpportunities = opportunities
    .filter(opp => {
      // Filter based on API selection
      const isOddsApi = opp.id.startsWith('odds-');
      const isRapidApi = opp.id.startsWith('rapid-');
      const apiFilter = (isOddsApi && settings.oddsApi) || (isRapidApi && settings.rapidApi);
      
      // Filter based on selected bookmakers
      // If no bookmakers are selected, show all opportunities
      // If bookmakers are selected, show only opportunities that have at least one selected bookmaker
      const bookmakerFilter = settings.selectedBookmakers.length === 0 || 
        opp.bets.some(bet => settings.selectedBookmakers.includes(bet.bookmaker));
      
      return apiFilter && bookmakerFilter;
    })
    .map((opp, index) => ({
      id: `${opp.homeTeam}-${opp.awayTeam}-${index}`,
      homeTeam: opp.homeTeam,
      awayTeam: opp.awayTeam,
      sport: selectedSport || '',
      commenceTime: new Date().toISOString(),
      return: opp.return,
      bets: opp.bets,
      isBetPlaced: betOpportunities.has(`${opp.homeTeam}-${opp.awayTeam}-${index}`)
    }));

  // Apply filters and sorting
  const filteredOpportunities = transformedOpportunities
    .filter((o) => o.return >= settings.minReturn)
    .sort((a, b) => {
      const multiplier = settings.sortOrder === 'desc' ? -1 : 1;
      
      switch (settings.sortBy) {
        case 'return':
          return (a.return - b.return) * multiplier;
        case 'risk':
          return (
            (Math.max(...a.bets.map((bet: Bet) => bet.odds)) -
              Math.max(...b.bets.map((bet: Bet) => bet.odds))) *
            multiplier
          );
        case 'time':
          return new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime() * multiplier;
        default:
          return 0;
      }
    });

  // Handle notifications
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const newOpportunities = filteredOpportunities.filter(
      (o) =>
        o.return >= settings.minReturnForNotification &&
        !history.some(
          (h) =>
            h.homeTeam === o.homeTeam &&
            h.awayTeam === o.awayTeam &&
            Math.abs(h.return - o.return) < 0.1
        )
    );

    newOpportunities.forEach((o) => {
      notificationService.notifyArbitrageOpportunity(
        o.homeTeam,
        o.awayTeam,
        o.return,
        o.bets.map((bet: Bet) => bet.bookmaker)
      );

      setHistory((prev) => [
        {
          timestamp: new Date().toISOString(),
          return: o.return,
          homeTeam: o.homeTeam,
          awayTeam: o.awayTeam,
          bookmakers: o.bets.map((bet: Bet) => bet.bookmaker),
          successful: true,
        },
        ...prev,
      ]);
    });
  }, [filteredOpportunities, settings.notificationsEnabled, settings.minReturnForNotification]);

  const handleBetPlaced = (id: string) => {
    setBetOpportunities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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
                    {sports.map((sport) => (
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
              availableBookmakers={availableBookmakers}
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
                              Math.max(max, curr.return),
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
                            (sum, curr) => sum + curr.return,
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
                              sum + (curr.return * settings.maxStake) / 100,
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
                      <div className="grid gap-4">
                        {filteredOpportunities.map((opportunity) => (
                          <OpportunityCard
                            key={opportunity.id}
                            opportunity={opportunity}
                            onBetPlaced={handleBetPlaced}
                          />
                        ))}
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

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Betting Table</h2>
        <BettingTable opportunities={Array.from(betOpportunities)} />
      </div>
    </div>
  );
}