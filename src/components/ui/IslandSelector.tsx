
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Island = 'Bonaire' | 'Saba' | 'Sint Eustatius';

interface IslandSelectorProps {
  selectedIsland?: Island;
  onIslandChange: (island: Island) => void;
  disabled?: boolean;
  placeholder?: string;
}

const IslandSelector: React.FC<IslandSelectorProps> = ({
  selectedIsland,
  onIslandChange,
  disabled = false,
  placeholder = "Select an island"
}) => {
  const islands: Island[] = ['Bonaire', 'Saba', 'Sint Eustatius'];

  return (
    <Select
      value={selectedIsland}
      onValueChange={(value) => onIslandChange(value as Island)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {islands.map((island) => (
          <SelectItem key={island} value={island}>
            {island}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default IslandSelector;
