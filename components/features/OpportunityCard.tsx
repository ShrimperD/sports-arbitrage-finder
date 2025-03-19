'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy } from 'lucide-react';
import { Game } from "@/types/odds";
import { formatDate } from "@/lib/utils";

interface Bet {
  team: string;
  odds: number;
  bookmaker: string;
  stake: number;
}

interface Opportunity {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  commenceTime: string;
  return: number;
  bets: Bet[];
  isBetPlaced?: boolean;
}

interface OpportunityCardProps {
  key?: string;
  opportunity: Game;
  onSelect: (opportunity: Game) => void;
}

export function OpportunityCard({ opportunity, onSelect }: OpportunityCardProps) {
  const [copied, setCopied] = useState(false);

  const formatOdds = (odds: number) => {
    return {
      decimal: odds.toFixed(2),
      american: odds >= 2 ? `+${((odds - 1) * 100).toFixed(0)}` : `-${(100 / (odds - 1)).toFixed(0)}`
    };
  };

  const formatOpportunityText = (opp: Opportunity) => {
    const odds1 = formatOdds(opp.bets[0].odds);
    const odds2 = formatOdds(opp.bets[1].odds);
    return `${opp.homeTeam} vs ${opp.awayTeam}
${opp.sport} - ${new Date(opp.commenceTime).toLocaleString()}
Return: ${opp.return.toFixed(2)}%

Bet 1: ${opp.bets[0].team}
${opp.bets[0].bookmaker}
Stake: $${opp.bets[0].stake.toFixed(2)}
Odds: ${odds1.decimal} (${odds1.american})

Bet 2: ${opp.bets[1].team}
${opp.bets[1].bookmaker}
Stake: $${opp.bets[1].stake.toFixed(2)}
Odds: ${odds2.decimal} (${odds2.american})`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatOpportunityText(opportunity as Opportunity));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Card 
      className={`${opportunity.isBetPlaced ? 'bg-red-50 dark:bg-red-950/20' : ''} cursor-pointer hover:bg-accent transition-colors`}
      onClick={() => onSelect(opportunity)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {opportunity.sport_title}
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {opportunity.source || 'Odds API'}
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <div className="font-medium">{opportunity.home_team} vs {opportunity.away_team}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(opportunity.commence_time)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 