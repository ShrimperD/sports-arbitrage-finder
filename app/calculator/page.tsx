'use client';

import { useState } from 'react';
import { Calculator as CalculatorIcon } from 'lucide-react';

interface BetCalculation {
  stake: number;
  odds1: number;
  odds2: number;
  profit: number;
  bet1: number;
  bet2: number;
  roi: number;
}

export default function CalculatorPage() {
  const [stake, setStake] = useState<number>(1000);
  const [odds1, setOdds1] = useState<number>(2.0);
  const [odds2, setOdds2] = useState<number>(2.1);

  const calculateArbitrage = (): BetCalculation | null => {
    if (!stake || !odds1 || !odds2 || odds1 <= 1 || odds2 <= 1) return null;

    const margin = (1 / odds1 + 1 / odds2) * 100;
    if (margin >= 100) return null;

    const bet1 = (stake * odds2) / (odds1 + odds2);
    const bet2 = stake - bet1;
    const profit = (bet1 * odds1) - stake;
    const roi = (profit / stake) * 100;

    return {
      stake,
      odds1,
      odds2,
      profit,
      bet1,
      bet2,
      roi
    };
  };

  const result = calculateArbitrage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Arbitrage Calculator</h2>
        <p className="text-muted-foreground">
          Calculate optimal bet amounts for arbitrage opportunities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Total Stake ($)
            </label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md bg-background"
              min="0"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Odds (Bookmaker 1)
            </label>
            <input
              type="number"
              value={odds1}
              onChange={(e) => setOdds1(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md bg-background"
              min="1.01"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Odds (Bookmaker 2)
            </label>
            <input
              type="number"
              value={odds2}
              onChange={(e) => setOdds2(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md bg-background"
              min="1.01"
              step="0.01"
            />
          </div>
        </div>

        <div className="space-y-4 p-6 border rounded-lg bg-card">
          {result ? (
            <>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Bet 1 Amount</div>
                <div className="text-2xl font-bold">${result.bet1.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Bet 2 Amount</div>
                <div className="text-2xl font-bold">${result.bet2.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Profit</div>
                <div className="text-2xl font-bold text-green-500">
                  ${result.profit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">ROI</div>
                <div className="text-2xl font-bold">{result.roi.toFixed(2)}%</div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <CalculatorIcon className="h-12 w-12 mx-auto mb-4" />
                <p>Enter valid odds to calculate arbitrage opportunity</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}