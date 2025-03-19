import { env } from '../env';
import { Sport, Game, Bookmaker, Market, Outcome } from '../../types/odds';

const BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = env.ODDS_API_KEY;

interface OddsApiResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

const SPORTS = [
  'americanfootball_ncaaf',
  'americanfootball_nfl',
  'baseball_mlb',
  'baseball_ncaa',
  'basketball_nba',
  'basketball_ncaab',
  'basketball_wncaab',
  'basketball_euroleague',
  'boxing_boxing',
  'cricket_international_t20',
  'cricket_ipl',
  'golf_pga_tour',
  'icehockey_nhl',
  'icehockey_ahl',
  'icehockey_liiga',
  'icehockey_mestis',
  'icehockey_sweden_hockey_league',
  'icehockey_sweden_allsvenskan',
  'lacrosse_ncaa',
  'mma_mixed_martial_arts',
  'rugbyleague_nrl',
  'soccer_australia_aleague',
  'soccer_austria_bundesliga',
  'soccer_belgium_first_div',
  'soccer_brazil_campeonato',
  'soccer_brazil_serie_b',
  'soccer_conmebol_copa_libertadores',
  'soccer_efl_champ',
  'soccer_england_league1',
  'soccer_england_league2',
  'soccer_fa_cup',
  'soccer_france_ligue_one',
  'soccer_france_ligue_two',
  'soccer_germany_bundesliga',
  'soccer_germany_bundesliga2',
  'soccer_germany_liga3',
  'soccer_greece_super_league',
  'soccer_italy_serie_a',
  'soccer_italy_serie_b',
  'soccer_japan_j_league',
  'soccer_korea_kleague1',
  'soccer_mexico_ligamx',
  'soccer_netherlands_eredivisie',
  'soccer_norway_eliteserien',
  'soccer_poland_ekstraklasa',
  'soccer_portugal_primeira_liga',
  'soccer_spain_la_liga',
  'soccer_spain_segunda_division',
  'soccer_spl',
  'soccer_sweden_allsvenskan',
  'soccer_sweden_superettan',
  'soccer_switzerland_superleague',
  'soccer_turkey_super_league',
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league',
  'soccer_uefa_europa_conference_league',
  'soccer_uefa_nations_league',
  'soccer_usa_mls',
  'tennis_atp_miami_open',
  'tennis_wta_miami_open'
] as const;

// Add rate limiting
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ensureRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
};

export const fetchOdds = async (sport: Sport): Promise<OddsApiResponse> => {
  try {
    await ensureRateLimit();
    const response = await fetch(
      `${BASE_URL}/sports/${sport}/odds?apiKey=${API_KEY}&regions=us&markets=h2h:1`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error response body for ${sport}:`, errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching odds for ${sport}:`, error);
    throw error;
  }
};

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