import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface RelatedItem {
  title: string;
  href: string;
  type: "match" | "article" | "prediction";
  badge?: string;
}

interface RelatedContentProps {
  items?: RelatedItem[];
  title?: string;
}

const defaultItems: RelatedItem[] = [
  { title: "Today's AI Predictions", href: "/", type: "prediction", badge: "Live" },
  { title: "Performance Tracker", href: "/performance", type: "prediction", badge: "Stats" },
  { title: "Leaderboard Rankings", href: "/leaderboard", type: "prediction", badge: "Top" },
  { title: "Latest Sports News", href: "/news", type: "article", badge: "News" },
  { title: "Accuracy Insights", href: "/insights", type: "prediction", badge: "AI" },
];

export const RelatedContent = ({ items = defaultItems, title = "Related Content" }: RelatedContentProps) => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <nav aria-label="Related content">
          <ul className="space-y-3">
            {items.slice(0, 5).map((item, idx) => (
              <li key={idx}>
                <Link
                  to={item.href}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">{item.badge}</Badge>
                    )}
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  );
};
