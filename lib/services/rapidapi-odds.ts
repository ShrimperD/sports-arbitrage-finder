import { Sport, Game, Bookmaker, Market, Outcome } from '../../types/odds';

export class RapidApiOddsService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly host: string;

  constructor() {
    // In Next.js, we need to use NEXT_PUBLIC_ prefix for client-side environment variables
    this.apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';
    this.baseUrl = 'https://sportsbook-api2.p.rapidapi.com';
    this.host = 'sportsbook-api2.p.rapidapi.com';

    console.log('RapidAPI Service initialized with:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      baseUrl: this.baseUrl,
      host: this.host
    });

    if (!this.apiKey) {
      console.warn('RapidAPI key is not set. Please check your environment variables.');
    }
  }

  private get headers() {
    const headers = {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': this.host,
    };
    console.log('Request headers:', headers);
    return headers;
  }

  async getArbitrageOpportunities(): Promise<Game[]> {
    try {
      const url = `${this.baseUrl}/v0/advantages/?type=ARBITRAGE`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RapidAPI error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw RapidAPI response:', data);
      
      const transformedData = this.transformResponse(data);
      console.log('Transformed RapidAPI data:', transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching arbitrage opportunities from RapidAPI:', error);
      return [];
    }
  }

  private transformResponse(data: any): Game[] {
    try {
      // Transform the RapidAPI response to match our Game type
      return data.map((item: any) => ({
        id: `rapid_${item.id}`,
        sport_key: item.sport_key,
        sport_title: item.sport_title,
        commence_time: item.commence_time,
        home_team: item.home_team,
        away_team: item.away_team,
        source: 'RapidAPI',
        bookmakers: item.bookmakers.map((bookmaker: any) => ({
          key: bookmaker.key,
          title: bookmaker.title,
          last_update: bookmaker.last_update,
          markets: bookmaker.markets.map((market: any) => ({
            key: market.key,
            outcomes: market.outcomes.map((outcome: any) => ({
              name: outcome.name,
              price: outcome.price,
            })),
          })),
        })),
      }));
    } catch (error) {
      console.error('Error transforming RapidAPI response:', error);
      console.error('Raw data that caused error:', data);
      return [];
    }
  }
} 