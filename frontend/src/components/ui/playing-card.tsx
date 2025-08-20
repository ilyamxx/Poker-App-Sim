import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: string | null;
  revealed?: boolean;
  className?: string;
}

export default function PlayingCard({ card, revealed = true, className }: PlayingCardProps) {

  if (!card) {
    // Render an empty slot if no card is present
    return <div className={cn("bg-green-900/50 rounded-md border-2 border-dashed border-green-700", className)} />;
  }

  if (!revealed) {
    // Render the card back
    return (
      <div className={cn(
        "bg-blue-800 rounded-md border-2 border-blue-900 flex items-center justify-center",
        "bg-gradient-to-br from-blue-700 to-blue-900",
        className
      )}>
        <div className="w-1/2 h-1/2 rounded-full bg-blue-600/50 border-2 border-blue-500" />
      </div>
    );
  }

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const isRed = suit === '♥' || suit === '♦';

  return (
    <div className={cn(
      "bg-white rounded-md border-2 border-gray-300 flex items-center justify-center shadow-md",
      className
    )}>
      <span className={cn("font-bold text-lg", isRed ? 'text-red-600' : 'text-black')}>
        {rank}{suit}
      </span>
    </div>
  );
}
