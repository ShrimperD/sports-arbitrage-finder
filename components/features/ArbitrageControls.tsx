import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

type InputChangeEvent = {
  target: {
    value: string;
  };
};

export type ArbitrageSettings = {
  minReturn: number;
  maxStake: number;
  sortBy: 'return' | 'risk' | 'time';
  sortOrder: 'asc' | 'desc';
  autoRefresh: boolean;
  refreshInterval: number;
  notificationsEnabled: boolean;
  minReturnForNotification: number;
  oddsApi: boolean;
  rapidApi: boolean;
  selectedBookmakers: string[];
};

type ArbitrageControlsProps = {
  settings: ArbitrageSettings;
  onSettingsChange: (settings: ArbitrageSettings) => void;
  availableBookmakers: string[];
};

export function ArbitrageControls({ settings, onSettingsChange, availableBookmakers }: ArbitrageControlsProps) {
  const handleChange = <K extends keyof ArbitrageSettings>(
    key: K,
    value: ArbitrageSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleBookmakerChange = (bookmaker: string, checked: boolean) => {
    const newBookmakers = checked
      ? [...settings.selectedBookmakers, bookmaker]
      : settings.selectedBookmakers.filter(b => b !== bookmaker);
    handleChange('selectedBookmakers', newBookmakers);
  };

  const handleSelectAll = (checked: boolean) => {
    handleChange('selectedBookmakers', checked ? availableBookmakers : []);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Configure arbitrage finder settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Data Sources</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="oddsApi"
              checked={settings.oddsApi}
              onCheckedChange={(checked: boolean) => handleChange('oddsApi', checked)}
            />
            <label htmlFor="oddsApi" className="text-sm font-medium">
              Odds API
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rapidApi"
              checked={settings.rapidApi}
              onCheckedChange={(checked: boolean) => handleChange('rapidApi', checked)}
            />
            <label htmlFor="rapidApi" className="text-sm font-medium">
              RapidAPI
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Bookmakers</Label>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectAll(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Select All
              </button>
              <button
                onClick={() => handleSelectAll(false)}
                className="text-xs text-blue-600 hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableBookmakers.map((bookmaker) => (
              <div key={bookmaker} className="flex items-center space-x-2">
                <Checkbox
                  id={bookmaker}
                  checked={settings.selectedBookmakers.includes(bookmaker)}
                  onCheckedChange={(checked: boolean) => handleBookmakerChange(bookmaker, checked)}
                />
                <label htmlFor={bookmaker} className="text-sm font-medium">
                  {bookmaker}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Minimum Return (%)</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[settings.minReturn]}
              onValueChange={([value]: number[]) => handleChange('minReturn', value)}
              min={0}
              max={10}
              step={0.1}
              className="flex-1"
            />
            <span className="w-12 text-right">{settings.minReturn.toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Maximum Stake ($)</Label>
          <Input
            type="number"
            value={settings.maxStake}
            onChange={(e: InputChangeEvent) => handleChange('maxStake', Number(e.target.value))}
            min={100}
            step={100}
          />
        </div>

        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select
            value={settings.sortBy}
            onValueChange={(value: ArbitrageSettings['sortBy']) =>
              handleChange('sortBy', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="return">Expected Return</SelectItem>
              <SelectItem value="risk">Risk Level</SelectItem>
              <SelectItem value="time">Time Until Event</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Select
            value={settings.sortOrder}
            onValueChange={(value: ArbitrageSettings['sortOrder']) =>
              handleChange('sortOrder', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Highest First</SelectItem>
              <SelectItem value="asc">Lowest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={settings.autoRefresh}
            onCheckedChange={(checked: boolean) => handleChange('autoRefresh', checked)}
          />
          <Label>Auto-refresh</Label>
        </div>

        {settings.autoRefresh && (
          <div className="space-y-2">
            <Label>Refresh Interval (seconds)</Label>
            <Select
              value={settings.refreshInterval.toString()}
              onValueChange={(value: string) =>
                handleChange('refreshInterval', Number(value))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked: boolean) =>
                handleChange('notificationsEnabled', checked)
              }
            />
            <Label>Enable Notifications</Label>
          </div>

          {settings.notificationsEnabled && (
            <div className="space-y-2">
              <Label>Minimum Return for Notification (%)</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[settings.minReturnForNotification]}
                  onValueChange={([value]: number[]) =>
                    handleChange('minReturnForNotification', value)
                  }
                  min={0}
                  max={10}
                  step={0.1}
                  className="flex-1"
                />
                <span className="w-12 text-right">
                  {settings.minReturnForNotification.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 