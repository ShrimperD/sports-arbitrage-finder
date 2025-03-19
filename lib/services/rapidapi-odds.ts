import { Sport, Game, Bookmaker, Market, Outcome } from '../../types/odds';

interface Competition {
  key: string;
  slug: string;
  name: string;
  shortName: string;
  sport: string;
}

interface Event {
  key: string;
  name: string;
  startTime: string;
  homeParticipantKey: string;
  participants: {
    key: string;
    slug: string;
    name: string;
    shortName: string;
    sport: string;
  }[];
}

interface MarketOutcome {
  key: string;
  description: string | null;
  modifier: number;
  payout: number;
  type: string;
  live: boolean;
  marketKey: string;
  readAt: string;
  lastFoundAt: string;
  source: string;
  participant: {
    key: string;
    slug: string;
    name: string;
    shortName: string;
    sport: string;
  };
}

interface MarketData {
  key: string;
  description: string | null;
  type: string;
  segment: string;
  lastFoundAt: string;
  outcomes: {
    [key: string]: MarketOutcome[];
  };
}

interface EventWithOdds extends Event {
  markets: MarketData[];
}

export class RapidApiOddsService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly host: string;

  constructor() {
    // Use the provided API key directly since it's a client-side service
    this.apiKey = '0c0404f737mshc8deeeb00fa4d74p160cf0jsnd8c7aaea1796';
    this.baseUrl = 'https://sportsbook-api2.p.rapidapi.com';
    this.host = 'sportsbook-api2.p.rapidapi.com';

    console.log('RapidAPI Service initialized with:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      baseUrl: this.baseUrl,
      host: this.host
    });
  }

  private get headers() {
    return {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': this.host,
    };
  }

  async getArbitrageOpportunities(): Promise<Game[]> {
    try {
      console.log('Starting RapidAPI fetch...');
      
      // Step 1: Get all competitions
      const competitions = await this.getCompetitions();
      console.log('Found competitions:', competitions);

      // Step 2: Get events for each competition
      const allEvents: Event[] = [];
      for (const competition of competitions) {
        const events = await this.getEvents(competition.key);
        allEvents.push(...events);
      }
      console.log('Found events:', allEvents);

      // Step 3: Get odds for all events (in batches of 50)
      const eventKeys = allEvents.map(event => event.key);
      const oddsData: EventWithOdds[] = [];
      
      for (let i = 0; i < eventKeys.length; i += 50) {
        const batch = eventKeys.slice(i, i + 50);
        const eventsWithOdds = await this.getEventsWithOdds(batch);
        oddsData.push(...eventsWithOdds);
      }
      console.log('Found odds data:', oddsData);

      // Transform the data to match our Game type
      const transformedData = this.transformResponse(oddsData);
      console.log('Transformed data:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching arbitrage opportunities from RapidAPI:', error);
      throw error; // Re-throw to handle in the hook
    }
  }

  private async getCompetitions(): Promise<Competition[]> {
    const url = `${this.baseUrl}/v0/competitions`;
    console.log('Fetching competitions from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Competitions API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.competitions;
  }

  private async getEvents(competitionKey: string): Promise<Event[]> {
    const url = `${this.baseUrl}/v0/competitions/${competitionKey}/events`;
    console.log('Fetching events from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Events API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.events;
  }

  private async getEventsWithOdds(eventKeys: string[]): Promise<EventWithOdds[]> {
    const queryParams = eventKeys.map(key => `eventKeys=${key}`).join('&');
    const url = `${this.baseUrl}/v0/events?${queryParams}`;
    console.log('Fetching odds from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Odds API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.events;
  }

  private transformResponse(events: EventWithOdds[]): Game[] {
    try {
      return events.map(event => {
        // Find the moneyline market
        const moneylineMarket = event.markets.find(market => 
          market.type === 'MONEYLINE' && market.segment === 'FULL_MATCH'
        );

        if (!moneylineMarket) {
          return null;
        }

        // Get all bookmakers from the outcomes
        const bookmakers = Object.entries(moneylineMarket.outcomes).map(([source, outcomes]) => {
          const market = {
            key: moneylineMarket.key,
            outcomes: outcomes.map(outcome => ({
              name: outcome.participant.name,
              price: outcome.payout,
            })),
          };

          return {
            key: source,
            title: source,
            last_update: outcome.lastFoundAt,
            markets: [market],
          };
        });

        return {
          id: `rapid_${event.key}`,
          sport_key: event.participants[0].sport,
          sport_title: event.participants[0].sport,
          commence_time: event.startTime,
          home_team: event.participants.find(p => p.key === event.homeParticipantKey)?.name || '',
          away_team: event.participants.find(p => p.key !== event.homeParticipantKey)?.name || '',
          source: 'RapidAPI',
          bookmakers,
        };
      }).filter((game): game is Game => game !== null);
    } catch (error) {
      console.error('Error transforming RapidAPI response:', error);
      return [];
    }
  }
} 