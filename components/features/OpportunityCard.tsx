'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy } from 'lucide-react';
import { Game, ArbitrageOpportunity } from "@/types/odds";
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
  opportunity: Game | ArbitrageOpportunity;
  onNotification: () => void;
}

export function OpportunityCard({ opportunity, onNotification }: OpportunityCardProps) {
  const [copied, setCopied] = useState(false);

  const formatOdds = (odds: number) => {
    return {
      decimal: odds.toFixed(2),
      american: odds >= 2 ? `+${((odds - 1) * 100).toFixed(0)}` : `-${(100 / (odds - 1)).toFixed(0)}`
    };
  };

  const formatOpportunityText = (opp: ArbitrageOpportunity) => {
    const odds1 = formatOdds(opp.bets[0].odds);
    const odds2 = formatOdds(opp.bets[1].odds);
    
    // Format for Google Sheets with tab separators
    return [
      // Header row
      ['Event', 'Sport', 'Date', 'Return %', 'Team 1', 'Bookmaker 1', 'Stake 1', 'Odds 1 (Decimal)', 'Odds 1 (American)', 'Team 2', 'Bookmaker 2', 'Stake 2', 'Odds 2 (Decimal)', 'Odds 2 (American)'].join('\t'),
      // Data row
      [
        `${opp.homeTeam} vs ${opp.awayTeam}`,
        opp.sportKey,
        new Date(opp.commenceTime).toLocaleString(),
        opp.totalReturn.toFixed(2),
        opp.bets[0].team,
        opp.bets[0].bookmaker,
        `$${opp.bets[0].stake.toFixed(2)}`,
        odds1.decimal,
        odds1.american,
        opp.bets[1].team,
        opp.bets[1].bookmaker,
        `$${opp.bets[1].stake.toFixed(2)}`,
        odds2.decimal,
        odds2.american
      ].join('\t')
    ].join('\n');
  };

  const handleCopy = async () => {
    if ('totalReturn' in opportunity) {
      try {
        await navigator.clipboard.writeText(formatOpportunityText(opportunity));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const isArbitrageOpportunity = (opp: Game | ArbitrageOpportunity): opp is ArbitrageOpportunity => {
    return 'totalReturn' in opp;
  };

  return (
    <Card className="cursor-pointer hover:bg-accent transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {isArbitrageOpportunity(opportunity) ? opportunity.sportKey : opportunity.sport_title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {isArbitrageOpportunity(opportunity) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleCopy();
              }}
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onNotification();
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <div className="font-medium">
            {isArbitrageOpportunity(opportunity) 
              ? `${opportunity.homeTeam} vs ${opportunity.awayTeam}`
              : `${opportunity.home_team} vs ${opportunity.away_team}`}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(new Date(isArbitrageOpportunity(opportunity) 
              ? opportunity.commenceTime 
              : opportunity.commence_time))}
          </div>
          {isArbitrageOpportunity(opportunity) && (
            <div className="mt-2 text-xs font-medium text-green-600">
              Return: {opportunity.totalReturn.toFixed(2)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 