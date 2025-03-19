export interface Sport {
  key: string;
  title: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Outcome {
  name: string;
  price: number;
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

export interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface ArbitrageOpportunity {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sportKey: string;
  commenceTime: string;
  totalReturn: number;
  bets: Array<{
    team: string;
    odds: number;
    bookmaker: string;
    stake: number;
  }>;
  bookmakers: Bookmaker[];
}

export interface HistoricalOpportunity {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  commenceTime: string;
  return: number;
  bookmakers: string[];
  successful: boolean;
  timestamp: string;
} 