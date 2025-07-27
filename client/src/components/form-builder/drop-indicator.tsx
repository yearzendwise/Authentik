import { useDroppable } from '@dnd-kit/core';

interface DropIndicatorProps {
  index: number;
  isActive?: boolean;
}

export function DropIndicator({ index, isActive = false }: DropIndicatorProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `drop-zone-${index}`,
    data: {
      accepts: ['form-element'],
      type: 'drop-zone',
      index: index
    }
  });

  const isHighlighted = isActive && isOver;

  return (
    <div
      ref={setNodeRef}
      className={`relative h-2 group transition-all duration-300 ${
        isHighlighted ? 'h-6' : 'hover:h-4'
      }`}
    >
      {/* Modern gradient drop indicator */}
      <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
        isHighlighted 
          ? 'h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/30 animate-pulse' 
          : isActive 
            ? 'h-0.5 bg-slate-200 rounded-full'
            : 'h-0.5 bg-transparent group-hover:bg-gradient-to-r group-hover:from-slate-300 group-hover:to-slate-400 group-hover:rounded-full'
      }`} />
      
      {/* Glowing effect when highlighted */}
      {isHighlighted && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-sm animate-pulse" />
      )}
    </div>
  );
}