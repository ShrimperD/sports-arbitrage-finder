import { env } from '../env';
import { Sport, Game, Bookmaker, Market, Outcome } from '../../types/odds';

export class OddsApiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY || '';
    this.baseUrl = 'https://api.the-odds-api.com/v4/sports';

    if (!this.apiKey) {
      console.warn('Odds API key is not set. Please check your environment variables.');
    }
  }

  async getSports(): Promise<Sport[]> {
    try {
      const response = await fetch(`${this.baseUrl}/all?apiKey=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sports:', error);
      return [];
    }
  }

  async getArbitrageOpportunities(): Promise<Game[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/all/odds/?apiKey=${this.apiKey}&regions=us&markets=h2h&oddsFormat=american`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        id: `odds_${item.id}`,
        source: 'Odds API'
      }));
    } catch (error) {
      console.error('Error fetching arbitrage opportunities:', error);
      return [];
    }
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey,
      ...params
    });

    const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
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