import { useState, useEffect, useCallback } from 'react';
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
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: string;
  bets: Array<{
    team: string;
    odds: number;
    bookmaker: string;
    stake: number;
    lastUpdated: string;
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

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export function useSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchSports = useCallback(async () => {
    try {
      console.log('Fetching sports from Odds API...');
      const oddsApi = new OddsApiService();
      const data = await oddsApi.getSports();
      
      if (!data || data.length === 0) {
        throw new Error('No sports data received');
      }

      console.log('Sports data received:', data);
      setSports(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sports';
      console.error('Error fetching sports:', errorMessage);
      setError(errorMessage);
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, RETRY_DELAY);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    fetchSports();
  }, [fetchSports]);

  return { sports, loading, error, retryCount };
}

export function useArbitrageOpportunities() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    oddsApi: { loading: false, error: null, lastUpdated: null },
    rapidApi: { loading: false, error: null, lastUpdated: null }
  });

  const calculateConfidence = (opportunity: ArbitrageOpportunity): 'high' | 'medium' | 'low' => {
    if (opportunity.return >= 5) return 'high';
    if (opportunity.return >= 2) return 'medium';
    return 'low';
  };

  const transformOddsApiOpportunity = (opp: any, sportKey: string): ArbitrageOpportunity => ({
    id: `odds_${opp.homeTeam}_${opp.awayTeam}`,
    homeTeam: opp.homeTeam,
    awayTeam: opp.awayTeam,
    sport: sportKey,
    commenceTime: new Date().toISOString(),
    return: opp.opportunity?.totalReturn || 0,
    source: 'Odds API' as const,
    confidence: calculateConfidence({
      id: '',
      homeTeam: opp.homeTeam,
      awayTeam: opp.awayTeam,
      sport: sportKey,
      commenceTime: new Date().toISOString(),
      return: opp.opportunity?.totalReturn || 0,
      source: 'Odds API',
      confidence: 'low',
      lastUpdated: new Date().toISOString(),
      bets: []
    }),
    lastUpdated: new Date().toISOString(),
    bets: (opp.opportunity?.bets || []).map((bet: any) => ({
      ...bet,
      lastUpdated: new Date().toISOString()
    }))
  });

  const transformRapidApiOpportunity = (game: Game): ArbitrageOpportunity => {
    try {
      // Extract unique bookmakers from the game
      const bookmakers = game.bookmakers.map(bm => bm.title);
      
      // Transform the bets, ensuring we only include valid bookmakers
      const bets = game.bookmakers.flatMap(bm => 
        bm.markets.flatMap(market => 
          market.outcomes.map(outcome => ({
            team: outcome.name,
            odds: outcome.price,
            bookmaker: bm.title,
            stake: 0, // Calculate stake based on odds
            lastUpdated: new Date().toISOString() // Use current time since last_update is not available
          }))
        )
      );

      // Calculate return percentage based on odds
      const returnPercentage = bets.reduce((acc, bet) => {
        const decimalOdds = 1 / bet.odds;
        return acc + decimalOdds;
      }, 0) * 100;

      return {
        id: `rapid_${game.id}`,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        sport: game.sport_title,
        commenceTime: game.commence_time,
        return: returnPercentage,
        source: 'RapidAPI' as const,
        confidence: calculateConfidence({
          id: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          sport: game.sport_title,
          commenceTime: game.commence_time,
          return: returnPercentage,
          source: 'RapidAPI',
          confidence: 'low',
          lastUpdated: new Date().toISOString(),
          bets: []
        }),
        lastUpdated: new Date().toISOString(),
        bets
      };
    } catch (error) {
      console.error('Error transforming RapidAPI opportunity:', error);
      throw error;
    }
  };

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    const isMounted = { current: true };

    try {
      console.log('Starting to fetch opportunities...');
      const oddsApi = new OddsApiService();
      const rapidApi = new RapidApiOddsService();
      
      let oddsApiOpportunities: ArbitrageOpportunity[] = [];
      let rapidApiOpportunities: ArbitrageOpportunity[] = [];

      // Fetch from Odds API
      try {
        console.log('Fetching from Odds API...');
        const oddsData = await oddsApi.findArbitrageOpportunities('basketball_nba');
        oddsApiOpportunities = oddsData.map(opp => transformOddsApiOpportunity(opp, 'basketball_nba'));
        console.log('Odds API Opportunities:', oddsApiOpportunities);
        
        if (isMounted.current) {
          setApiStatus(prev => ({
            ...prev,
            oddsApi: { ...prev.oddsApi, loading: false, lastUpdated: new Date() }
          }));
        }
      } catch (oddsErr) {
        const errorMessage = oddsErr instanceof Error ? oddsErr.message : 'Failed to fetch from Odds API';
        console.error('Error fetching from Odds API:', errorMessage);
        
        if (isMounted.current) {
          setApiStatus(prev => ({
            ...prev,
            oddsApi: { ...prev.oddsApi, loading: false, error: errorMessage }
          }));
        }
      }

      // Fetch from RapidAPI
      setApiStatus(prev => ({ ...prev, rapidApi: { ...prev.rapidApi, loading: true, error: null } }));
      try {
        console.log('Fetching from RapidAPI...');
        const rapidData = await rapidApi.getArbitrageOpportunities();
        console.log('Raw RapidAPI data:', rapidData);
        
        rapidApiOpportunities = rapidData
          .map(game => {
            try {
              return transformRapidApiOpportunity(game);
            } catch (transformErr) {
              console.error('Error transforming RapidAPI game:', transformErr);
              return null;
            }
          })
          .filter((opp): opp is ArbitrageOpportunity => opp !== null);
        
        console.log('Transformed RapidAPI Opportunities:', rapidApiOpportunities);
        
        if (isMounted.current) {
          setApiStatus(prev => ({
            ...prev,
            rapidApi: { ...prev.rapidApi, loading: false, lastUpdated: new Date() }
          }));
        }
      } catch (rapidErr) {
        const errorMessage = rapidErr instanceof Error ? rapidErr.message : 'Failed to fetch from RapidAPI';
        console.error('Error fetching from RapidAPI:', errorMessage);
        
        if (isMounted.current) {
          setApiStatus(prev => ({
            ...prev,
            rapidApi: { ...prev.rapidApi, loading: false, error: errorMessage }
          }));
        }
      }

      // Combine and deduplicate opportunities
      const combinedOpportunities = [...oddsApiOpportunities, ...rapidApiOpportunities];
      console.log('Combined opportunities before deduplication:', combinedOpportunities);

      const uniqueOpportunities = combinedOpportunities.filter((opp, index, self) =>
        index === self.findIndex((o) => o.id === opp.id)
      );

      // Sort opportunities by return percentage (highest first) and confidence
      const sortedOpportunities = uniqueOpportunities.sort((a, b) => {
        if (a.confidence !== b.confidence) {
          const confidenceOrder = { high: 3, medium: 2, low: 1 };
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        }
        return b.return - a.return;
      });

      console.log('Final sorted opportunities:', sortedOpportunities);
      
      if (isMounted.current) {
        setOpportunities(sortedOpportunities);
        setLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
        setLoading(false);
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = fetchOpportunities();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [fetchOpportunities]);

  return {
    opportunities,
    loading,
    error,
    apiStatus,
    isLoading: loading,
    refetch: fetchOpportunities
  };
} 