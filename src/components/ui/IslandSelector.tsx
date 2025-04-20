
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IslandSelectorProps {
  selectedIsland: 'Bonaire' | 'Saba' | 'Sint Eustatius' | undefined;
  onIslandChange: (island: 'Bonaire' | 'Saba' | 'Sint Eustatius' | 'all' | undefined) => void;
  placeholder?: string;
  showAllOption?: boolean;
  disabled?: boolean;
}

const IslandSelector: React.FC<IslandSelectorProps> = ({
  selectedIsland,
  onIslandChange,
  placeholder = "Select Island",
  showAllOption = false,
  disabled = false
}) => {
  const handleChange = (value: string) => {
    if (value === 'all') {
      onIslandChange('all');
    } else if (value === 'Bonaire' || value === 'Saba' || value === 'Sint Eustatius') {
      onIslandChange(value);
    } else {
      onIslandChange(undefined);
    }
  };

  return (
    <Select
      value={selectedIsland || (showAllOption ? 'all' : '')}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && <SelectItem value="all">All Islands</SelectItem>}
        <SelectItem value="Bonaire">Bonaire</SelectItem>
        <SelectItem value="Saba">Saba</SelectItem>
        <SelectItem value="Sint Eustatius">Sint Eustatius</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default IslandSelector;
