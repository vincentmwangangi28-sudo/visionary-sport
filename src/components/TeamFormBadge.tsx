interface Props { form: string; label?: string; }

const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  W: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  D: { bg: 'bg-amber-400', text: 'text-white', border: 'border-amber-500' },
  L: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
};

export const TeamFormBadge = ({ form, label }: Props) => (
  <div className="flex items-center gap-2">
    {label && <span className="text-xs text-muted-foreground w-20 truncate">{label}</span>}
    <div className="flex gap-1">
      {form.split('').slice(-5).map((r, i) => {
        const c = COLORS[r] ?? { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
        return (
          <span key={i} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border ${c.bg} ${c.text} ${c.border}`}>
            {r}
          </span>
        );
      })}
    </div>
  </div>
);
