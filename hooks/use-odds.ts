import { useState, useEffect } from 'react';
import { OddsApiService, Sport, Game } from '@/lib/services/odds-api';

const oddsApi = new OddsApiService();

export function useOdds(sportKey?: string) {
  const [sports, setSports] = useState<Sport[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available sports
  useEffect(() => {
    async function fetchSports() {
      try {
        setLoading(true);
        const data = await oddsApi.getSports();
        setSports(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sports');
      } finally {
        setLoading(false);
      }
    }

    fetchSports();
  }, []);

  // Fetch odds for selected sport
  useEffect(() => {
    async function fetchOdds() {
      if (!sportKey) return;

      try {
        setLoading(true);
        const data = await oddsApi.getOdds(sportKey);
        setGames(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch odds');
      } finally {
        setLoading(false);
      }
    }

    fetchOdds();
  }, [sportKey]);

  return {
    sports,
    games,
    loading,
    error,
  };
}

export function useArbitrageOpportunities(sportKey?: string) {
  const [opportunities, setOpportunities] = useState<ReturnType<typeof oddsApi.findArbitrageOpportunities> extends Promise<infer T> ? T : never>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpportunities() {
      if (!sportKey) return;

      try {
        setLoading(true);
        const data = await oddsApi.findArbitrageOpportunities(sportKey);
        setOpportunities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch arbitrage opportunities');
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();

    // Set up polling every minute
    const interval = setInterval(fetchOpportunities, 60000);
    return () => clearInterval(interval);
  }, [sportKey]);

  return {
    opportunities,
    loading,
    error,
  };
} 