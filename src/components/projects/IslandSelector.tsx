
import { Island } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface IslandSelectorProps {
  selectedIsland: Island | null;
  onIslandChange: (island: Island | null) => void;
  loading?: boolean;
  label?: string;
  placeholder?: string;
}

const IslandSelector = ({
  selectedIsland,
  onIslandChange,
  loading = false,
  label = "Island",
  placeholder = "Select an island"
}: IslandSelectorProps) => {
  const islands: Island[] = ['Bonaire', 'Saba', 'Sint Eustatius'];
  
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select
        value={selectedIsland || ""}
        onValueChange={(value) => onIslandChange(value as Island || null)}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Islands</SelectItem>
          {islands.map((island) => (
            <SelectItem key={island} value={island}>
              {island}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default IslandSelector;
