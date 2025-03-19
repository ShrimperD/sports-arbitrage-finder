import { useState, useEffect } from 'react';
import { OddsApiService } from '@/lib/services/odds-api';
import { RapidApiOddsService } from '@/lib/services/rapidapi-odds';
import { Sport, Game } from '@/types/odds';

interface ArbitrageOpportunity {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  commenceTime: string;
  return: number;
  bets: Array<{
    team: string;
    odds: number;
    bookmaker: string;
    stake: number;
  }>;
}

export function useSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const oddsApi = new OddsApiService();
        const data = await oddsApi.getSports();
        console.log('Sports from Odds API:', data);
        setSports(data);
      } catch (err) {
        setError('Failed to fetch sports');
        console.error('Error fetching sports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSports();
  }, []);

  return { sports, loading, error };
}

export function useArbitrageOpportunities(sportKey?: string) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const oddsApi = new OddsApiService();
        const rapidApi = new RapidApiOddsService();
        
        console.log('Fetching opportunities from both APIs...');
        
        // Fetch from both APIs
        const [oddsApiOpportunities, rapidApiOpportunities] = await Promise.all([
          sportKey ? oddsApi.findArbitrageOpportunities(sportKey) : Promise.resolve([]),
          rapidApi.getArbitrageOpportunities()
        ]);

        // Transform RapidAPI opportunities to match our format
        const transformedRapidApiOpportunities = rapidApiOpportunities.map(game => ({
          id: `rapid_${game.id}`,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          sport: game.sport_title,
          commenceTime: game.commence_time,
          return: 0, // Calculate return based on odds
          bets: game.bookmakers.flatMap(bm => 
            bm.markets.flatMap(market => 
              market.outcomes.map(outcome => ({
                team: outcome.name,
                odds: outcome.price,
                bookmaker: bm.title,
                stake: 0 // Calculate stake based on odds
              }))
            )
          )
        }));

        // Transform Odds API opportunities
        const transformedOddsApiOpportunities = oddsApiOpportunities.map(opp => ({
          id: `odds_${opp.homeTeam}_${opp.awayTeam}`,
          homeTeam: opp.homeTeam,
          awayTeam: opp.awayTeam,
          sport: sportKey || '',
          commenceTime: new Date().toISOString(),
          return: opp.opportunity?.totalReturn || 0,
          bets: opp.opportunity?.bets || []
        }));

        console.log('Odds API Opportunities:', transformedOddsApiOpportunities);
        console.log('RapidAPI Opportunities:', transformedRapidApiOpportunities);

        // Combine and deduplicate opportunities
        const combinedOpportunities = [...transformedOddsApiOpportunities, ...transformedRapidApiOpportunities];
        const uniqueOpportunities = combinedOpportunities.filter((opp, index, self) =>
          index === self.findIndex((o) => o.id === opp.id)
        );

        console.log('Combined and deduplicated opportunities:', uniqueOpportunities);
        setOpportunities(uniqueOpportunities);
      } catch (err) {
        setError('Failed to fetch arbitrage opportunities');
        console.error('Error fetching opportunities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [sportKey]);

  return { opportunities, loading, error };
} 