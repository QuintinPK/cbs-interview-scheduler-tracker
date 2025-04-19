
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
  onIslandChange: (island: Island | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  includeAll?: boolean;
  className?: string;
}

const IslandSelector: React.FC<IslandSelectorProps> = ({
  selectedIsland,
  onIslandChange,
  disabled = false,
  placeholder = "Select an island",
  includeAll = false,
  className
}) => {
  const islands: Island[] = ['Bonaire', 'Saba', 'Sint Eustatius'];

  return (
    <Select
      value={selectedIsland || "all"}
      onValueChange={(value) => onIslandChange(value === "all" ? undefined : value as Island)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectItem value="all">{placeholder}</SelectItem>
        )}
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
