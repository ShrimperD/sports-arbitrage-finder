import { useState, useEffect } from 'react';
import { OddsApiService } from '@/lib/services/odds-api';
import { RapidApiOddsService } from '@/lib/services/rapidapi-odds';
import { Sport, Game } from '@/types/odds';

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
  const [opportunities, setOpportunities] = useState<Game[]>([]);
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

        console.log('Odds API Opportunities:', oddsApiOpportunities);
        console.log('RapidAPI Opportunities:', rapidApiOpportunities);

        // Combine and deduplicate opportunities
        const combinedOpportunities = [...oddsApiOpportunities, ...rapidApiOpportunities];
        const uniqueOpportunities = combinedOpportunities.filter((game, index, self) =>
          index === self.findIndex((g) => g.id === game.id)
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