'use client';

import { useState } from 'react';
import { Bell, DollarSign, Percent, Globe } from 'lucide-react';

interface Settings {
  notifications: boolean;
  defaultStake: number;
  minArbitrage: number;
  timezone: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    defaultStake: 1000,
    minArbitrage: 2.0,
    timezone: 'UTC',
  });

  const handleChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your preferences and account settings.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <label className="font-medium">Enable Notifications</label>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleChange('notifications', e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold">Betting Preferences</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <label className="font-medium">Default Stake Amount ($)</label>
              </div>
              <input
                type="number"
                value={settings.defaultStake}
                onChange={(e) => handleChange('defaultStake', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md bg-background"
                min="0"
                step="100"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <label className="font-medium">Minimum Arbitrage (%)</label>
              </div>
              <input
                type="number"
                value={settings.minArbitrage}
                onChange={(e) => handleChange('minArbitrage', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md bg-background"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold">Regional Settings</h3>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <label className="font-medium">Timezone</label>
            </div>
            <select
              value={settings.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time (EST)</option>
              <option value="PST">Pacific Time (PST)</option>
              <option value="GMT">Greenwich Mean Time (GMT)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}