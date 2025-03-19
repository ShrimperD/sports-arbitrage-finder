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
  source: 'Odds API' | 'RapidAPI';
  bets: Array<{
    team: string;
    odds: number;
    bookmaker: string;
    stake: number;
  }>;
}

interface ApiStatus {
  oddsApi: {
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
  };
  rapidApi: {
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
  };
}

export function useSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        console.log('Fetching sports from Odds API...');
        const oddsApi = new OddsApiService();
        const data = await oddsApi.getSports();
        console.log('Sports data received:', data);
        setSports(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sports';
        console.error('Error fetching sports:', errorMessage);
        setError(errorMessage);
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
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    oddsApi: { loading: false, error: null, lastUpdated: null },
    rapidApi: { loading: false, error: null, lastUpdated: null }
  });

  useEffect(() => {
    let isMounted = true;

    const fetchOpportunities = async () => {
      try {
        console.log('Starting to fetch opportunities...');
        const oddsApi = new OddsApiService();
        const rapidApi = new RapidApiOddsService();
        
        let oddsApiOpportunities: ArbitrageOpportunity[] = [];
        let rapidApiOpportunities: ArbitrageOpportunity[] = [];

        // Fetch from Odds API
        setApiStatus(prev => ({ ...prev, oddsApi: { ...prev.oddsApi, loading: true, error: null } }));
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
              source: 'Odds API' as const,
              bets: opp.opportunity?.bets || []
            }));
            console.log('Odds API Opportunities:', oddsApiOpportunities);
          }
        } catch (oddsErr) {
          const errorMessage = oddsErr instanceof Error ? oddsErr.message : 'Failed to fetch from Odds API';
          console.error('Error fetching from Odds API:', errorMessage);
          setApiStatus(prev => ({
            ...prev,
            oddsApi: { ...prev.oddsApi, error: errorMessage, loading: false }
          }));
        }

        // Fetch from RapidAPI
        setApiStatus(prev => ({ ...prev, rapidApi: { ...prev.rapidApi, loading: true, error: null } }));
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
            source: 'RapidAPI' as const,
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
          const errorMessage = rapidErr instanceof Error ? rapidErr.message : 'Failed to fetch from RapidAPI';
          console.error('Error fetching from RapidAPI:', errorMessage);
          setApiStatus(prev => ({
            ...prev,
            rapidApi: { ...prev.rapidApi, error: errorMessage, loading: false }
          }));
        }

        // Update API status
        if (isMounted) {
          setApiStatus(prev => ({
            oddsApi: { ...prev.oddsApi, loading: false, lastUpdated: new Date() },
            rapidApi: { ...prev.rapidApi, loading: false, lastUpdated: new Date() }
          }));
        }

        // Combine and deduplicate opportunities
        const combinedOpportunities = [...oddsApiOpportunities, ...rapidApiOpportunities];
        console.log('Combined opportunities before deduplication:', combinedOpportunities);

        const uniqueOpportunities = combinedOpportunities.filter((opp, index, self) =>
          index === self.findIndex((o) => o.id === opp.id)
        );

        // Sort opportunities by return percentage (highest first)
        const sortedOpportunities = uniqueOpportunities.sort((a, b) => b.return - a.return);

        console.log('Final sorted opportunities:', sortedOpportunities);
        
        if (isMounted) {
          setOpportunities(sortedOpportunities);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch arbitrage opportunities';
        console.error('Error in fetchOpportunities:', errorMessage);
        if (isMounted) {
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 60000); // Refresh every minute

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sportKey]);

  return { 
    opportunities, 
    loading, 
    error,
    apiStatus
  };
} 