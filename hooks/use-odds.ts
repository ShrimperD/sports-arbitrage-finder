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
        console.log('Starting to fetch opportunities...');
        const oddsApi = new OddsApiService();
        const rapidApi = new RapidApiOddsService();
        
        let oddsApiOpportunities: ArbitrageOpportunity[] = [];
        let rapidApiOpportunities: ArbitrageOpportunity[] = [];

        // Fetch from Odds API
        try {
          console.log('Fetching from Odds API...');
          if (sportKey) {
            const oddsData = await oddsApi.findArbitrageOpportunities(sportKey);
            oddsApiOpportunities = oddsData.map(opp => ({
              id: `odds_${opp.homeTeam}_${opp.awayTeam}`,
              homeTeam: opp.homeTeam,
              awayTeam: opp.awayTeam,
              sport: sportKey,
              commenceTime: new Date().toISOString(),
              return: opp.opportunity?.totalReturn || 0,
              bets: opp.opportunity?.bets || []
            }));
            console.log('Odds API Opportunities:', oddsApiOpportunities);
          }
        } catch (oddsErr) {
          console.error('Error fetching from Odds API:', oddsErr);
        }

        // Fetch from RapidAPI
        try {
          console.log('Fetching from RapidAPI...');
          const rapidData = await rapidApi.getArbitrageOpportunities();
          rapidApiOpportunities = rapidData.map(game => ({
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
          console.log('RapidAPI Opportunities:', rapidApiOpportunities);
        } catch (rapidErr) {
          console.error('Error fetching from RapidAPI:', rapidErr);
        }

        // Combine and deduplicate opportunities
        const combinedOpportunities = [...oddsApiOpportunities, ...rapidApiOpportunities];
        console.log('Combined opportunities before deduplication:', combinedOpportunities);

        const uniqueOpportunities = combinedOpportunities.filter((opp, index, self) =>
          index === self.findIndex((o) => o.id === opp.id)
        );

        console.log('Final deduplicated opportunities:', uniqueOpportunities);
        setOpportunities(uniqueOpportunities);
      } catch (err) {
        console.error('Error in fetchOpportunities:', err);
        setError('Failed to fetch arbitrage opportunities');
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