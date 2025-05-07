
import React from "react";
import { Badge } from "@/components/ui/badge";

interface IslandBadgeProps {
  island?: string;
}

const IslandBadge: React.FC<IslandBadgeProps> = ({ island }) => {
  const getIslandBadgeStyle = (island: string | undefined) => {
    switch (island) {
      case 'Bonaire':
        return { variant: "success" as const };
      case 'Saba':
        return { variant: "warning" as const };
      case 'Sint Eustatius':
        return { variant: "danger" as const };
      default:
        return { variant: "outline" as const };
    }
  };

  if (!island) {
    return <span className="text-muted-foreground text-sm">Not assigned</span>;
  }

  return (
    <Badge {...getIslandBadgeStyle(island)}>
      {island}
    </Badge>
  );
};

export default IslandBadge;
