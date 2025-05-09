
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle, Users, Percent } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: "activity" | "check-circle" | "users" | "percent";
  trend: "up" | "down" | "neutral";
  percent: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  percent
}) => {
  const getIcon = () => {
    switch (icon) {
      case "activity":
        return <Activity className="h-5 w-5 text-blue-500" />;
      case "check-circle":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "users":
        return <Users className="h-5 w-5 text-purple-500" />;
      case "percent":
        return <Percent className="h-5 w-5 text-amber-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      case "neutral":
        return "text-gray-500";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            {getIcon()}
          </div>
        </div>
        
        {percent !== 0 && (
          <div className="mt-4">
            <span className={`text-xs font-medium ${getTrendColor()}`}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : ""}
              {percent}%
            </span>
            <span className="text-xs text-gray-500 ml-1">
              {trend === "up" ? "increase" : trend === "down" ? "decrease" : "change"} from yesterday
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
