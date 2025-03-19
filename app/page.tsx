'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArbitrageControls, type ArbitrageSettings } from '@/components/features/ArbitrageControls';
import { ArbitrageHistory, type HistoricalOpportunity } from '@/components/features/ArbitrageHistory';
import { NotificationService } from '@/lib/services/notification';
import { useArbitrageOpportunities } from '@/hooks/use-odds';
import { OpportunityCard } from '@/components/features/OpportunityCard';
import { BettingTable } from '@/components/features/BettingTable';
import { formatDate } from '@/lib/utils';
import { ArbitrageOpportunity } from '@/types/odds';

export default function Home() {
  const [settings, setSettings] = useState<ArbitrageSettings>({
    sortBy: 'return'
  });

  const { opportunities, isLoading, error, refetch } = useArbitrageOpportunities();

  const [historicalOpportunities, setHistoricalOpportunities] = useState<HistoricalOpportunity[]>([]);

  useEffect(() => {
    if (opportunities.length > 0) {
      const newOpportunities = opportunities.map(opp => ({
        id: `${opp.id}_${Date.now()}`,
        homeTeam: opp.homeTeam,
        awayTeam: opp.awayTeam,
        sport: opp.sportKey,
        commenceTime: opp.commenceTime,
        return: opp.totalReturn,
        bookmakers: opp.bookmakers.map(b => b.title),
        successful: true,
        timestamp: new Date().toISOString()
      }));

      setHistoricalOpportunities(prev => [...newOpportunities, ...prev]);
    }
  }, [opportunities]);

  const handleSettingsChange = (newSettings: ArbitrageSettings) => {
    setSettings(newSettings);
  };

  const handleNotification = (opportunity: HistoricalOpportunity) => {
    NotificationService.getInstance().notifyArbitrageOpportunity(
      opportunity.homeTeam,
      opportunity.awayTeam,
      opportunity.return,
      opportunity.bookmakers
    );
  };

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    switch (settings.sortBy) {
      case 'return':
        return b.totalReturn - a.totalReturn;
      case 'profit':
        return b.totalReturn - a.totalReturn;
      case 'stake':
        return b.bets.reduce((sum, bet) => sum + bet.stake, 0) -
               a.bets.reduce((sum, bet) => sum + bet.stake, 0);
      case 'date':
        return new Date(b.commenceTime).getTime() - new Date(a.commenceTime).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Arbitrage Opportunities</CardTitle>
          <CardDescription>Find profitable betting opportunities across different bookmakers</CardDescription>
        </CardHeader>
        <CardContent>
          <ArbitrageControls
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onRefresh={refetch}
            isLoading={isLoading}
          />

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              Error: {error}
            </div>
          )}

          <ScrollArea className="h-[600px] mt-4">
            <div className="space-y-4">
              {sortedOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onNotification={() => handleNotification({
                    id: opportunity.id,
                    homeTeam: opportunity.homeTeam,
                    awayTeam: opportunity.awayTeam,
                    sport: opportunity.sportKey,
                    commenceTime: opportunity.commenceTime,
                    return: opportunity.totalReturn,
                    bookmakers: opportunity.bookmakers.map(b => b.title),
                    successful: true,
                    timestamp: new Date().toISOString()
                  })}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hedge Calculator</CardTitle>
          <CardDescription>Calculate optimal hedge bets for your positions</CardDescription>
        </CardHeader>
        <CardContent>
          <BettingTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historical Opportunities</CardTitle>
          <CardDescription>View past arbitrage opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <ArbitrageHistory opportunities={historicalOpportunities} />
        </CardContent>
      </Card>
    </div>
  );
}