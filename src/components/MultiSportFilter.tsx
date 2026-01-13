import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MultiSportFilterProps {
  onFilterChange: (sport: string | null) => void;
  activeSport: string | null;
}

const SPORTS = [
  { id: null, name: "All", icon: "🏆", count: null },
  { id: "football", name: "Football", icon: "⚽", count: null },
  { id: "basketball", name: "Basketball", icon: "🏀", count: null },
  { id: "tennis", name: "Tennis", icon: "🎾", count: null },
];

export const MultiSportFilter = ({ onFilterChange, activeSport }: MultiSportFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SPORTS.map((sport) => (
        <Button
          key={sport.id ?? 'all'}
          variant={activeSport === sport.id ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(sport.id)}
          className="gap-2"
        >
          <span>{sport.icon}</span>
          {sport.name}
          {sport.count !== null && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {sport.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};
