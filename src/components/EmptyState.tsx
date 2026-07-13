import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  emoji?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, emoji }: Props) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    {emoji ? (
      <span className="text-5xl mb-4">{emoji}</span>
    ) : Icon ? (
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
    ) : null}
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    {description && <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>}
    {action && (
      <Button onClick={action.onClick} variant="outline" size="sm">{action.label}</Button>
    )}
  </div>
);
