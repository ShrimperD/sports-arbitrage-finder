import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';

export type SortOption = 'return' | 'profit' | 'stake' | 'date';

export interface ArbitrageSettings {
  sortBy: SortOption;
}

interface ArbitrageControlsProps {
  settings: ArbitrageSettings;
  onSettingsChange: (settings: ArbitrageSettings) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ArbitrageControls({
  settings,
  onSettingsChange,
  onRefresh,
  isLoading
}: ArbitrageControlsProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-background border rounded-lg">
      <Select
        value={settings.sortBy}
        onValueChange={(value: SortOption) => onSettingsChange({ ...settings, sortBy: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="return">Return (%)</SelectItem>
          <SelectItem value="profit">Profit ($)</SelectItem>
          <SelectItem value="stake">Stake ($)</SelectItem>
          <SelectItem value="date">Date</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        className="ml-auto"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
} 