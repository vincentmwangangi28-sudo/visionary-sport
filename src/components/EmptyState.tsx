import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: Icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="rounded-full bg-muted p-6 mb-6">
      <Icon className="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
    {actionLabel && actionTo && (
      <Link to={actionTo}>
        <Button>{actionLabel}</Button>
      </Link>
    )}
    {actionLabel && onAction && (
      <Button onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
);
