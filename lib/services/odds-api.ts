import { env } from '../env';

export type Sport = {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
};

export type Bookmaker = {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
};

export type Market = {
  key: string;
  outcomes: Outcome[];
};

export type Outcome = {
  name: string;
  price: number;
};

export type Game = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

const BASE_URL = 'https://api.the-odds-api.com/v4';

export class OddsApiService {
  private apiKey: string;

  constructor() {
    this.apiKey = env.ODDS_API_KEY;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey,
      ...params
    });

    const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getSports(): Promise<Sport[]> {
    return this.fetch<Sport[]>('/sports');
  }

  async getOdds(sportKey: string): Promise<Game[]> {
    return this.fetch<Game[]>(`/sports/${sportKey}/odds`, {
      regions: 'us',
      markets: 'h2h,spreads',
      oddsFormat: 'decimal'
    });
  }

  async findArbitrageOpportunities(sportKey: string): Promise<{
    homeTeam: string;
    awayTeam: string;
    opportunity: {
      totalReturn: number;
      bets: Array<{
        team: string;
        odds: number;
        bookmaker: string;
        stake: number;
      }>;
    } | null;
  }[]> {
    const games = await this.getOdds(sportKey);
    const opportunities = [];

    for (const game of games) {
      const h2hMarkets = game.bookmakers.map(bm => ({
        bookmaker: bm.title,
        market: bm.markets.find(m => m.key === 'h2h')
      })).filter(x => x.market);

      if (h2hMarkets.length < 2) continue;

      const bestOdds = {
        home: { odds: 0, bookmaker: '' },
        away: { odds: 0, bookmaker: '' }
      };

      for (const { bookmaker, market } of h2hMarkets) {
        if (!market) continue;
        
        const homeOdds = market.outcomes.find(o => o.name === game.home_team)?.price || 0;
        const awayOdds = market.outcomes.find(o => o.name === game.away_team)?.price || 0;

        if (homeOdds > bestOdds.home.odds) {
          bestOdds.home = { odds: homeOdds, bookmaker };
        }
        if (awayOdds > bestOdds.away.odds) {
          bestOdds.away = { odds: awayOdds, bookmaker };
        }
      }

      // Calculate arbitrage opportunity
      const margin = (1 / bestOdds.home.odds) + (1 / bestOdds.away.odds);
      
      if (margin < 1) {
        // Arbitrage opportunity exists
        const totalStake = 1000; // Example stake
        const homeStake = (totalStake / bestOdds.home.odds) / margin;
        const awayStake = (totalStake / bestOdds.away.odds) / margin;

        opportunities.push({
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          opportunity: {
            totalReturn: totalStake / margin,
            bets: [
              {
                team: game.home_team,
                odds: bestOdds.home.odds,
                bookmaker: bestOdds.home.bookmaker,
                stake: homeStake
              },
              {
                team: game.away_team,
                odds: bestOdds.away.odds,
                bookmaker: bestOdds.away.bookmaker,
                stake: awayStake
              }
            ]
          }
        });
      } else {
        opportunities.push({
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          opportunity: null
        });
      }
    }

    return opportunities;
  }
} 