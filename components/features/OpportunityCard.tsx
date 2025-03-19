'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy } from 'lucide-react';

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
  opportunity: Opportunity;
  onBetPlaced: (id: string) => void;
}

export function OpportunityCard({ opportunity, onBetPlaced }: OpportunityCardProps) {
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
      await navigator.clipboard.writeText(formatOpportunityText(opportunity));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Card className={`${opportunity.isBetPlaced ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {opportunity.homeTeam} vs {opportunity.awayTeam}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {opportunity.sport} • {new Date(opportunity.commenceTime).toLocaleString()}
            </div>
            <div className="text-sm font-medium text-green-500">
              {opportunity.return.toFixed(2)}%
            </div>
          </div>

          {opportunity.bets.map((bet, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{bet.team}</div>
                  <div className="text-sm text-muted-foreground">{bet.bookmaker}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${bet.stake.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatOdds(bet.odds).decimal} ({formatOdds(bet.odds).american})
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Details
                </>
              )}
            </Button>
            <Button
              variant={opportunity.isBetPlaced ? "secondary" : "default"}
              size="sm"
              onClick={() => onBetPlaced(opportunity.id)}
              className="text-xs"
            >
              {opportunity.isBetPlaced ? 'Bet Placed' : 'Place Bet'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 