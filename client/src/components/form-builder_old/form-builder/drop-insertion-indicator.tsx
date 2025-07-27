import { useDroppable } from '@dnd-kit/core';

interface DropInsertionIndicatorProps {
  id: string;
  position: 'top' | 'bottom';
  elementId: string;
  isVisible: boolean;
}

export function DropInsertionIndicator({ id, position, elementId, isVisible }: DropInsertionIndicatorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      elementId,
      position,
      isInsertionPoint: true,
    },
  });

  if (!isVisible) return null;

  return (
    <div
      ref={setNodeRef}
      className={`relative h-2 -my-1 transition-all duration-200 ${
        isOver ? 'z-50' : 'z-10'
      }`}
    >
      <div
        className={`absolute inset-x-0 h-0.5 rounded-full transition-all duration-200 ${
          isOver 
            ? 'bg-blue-500 shadow-lg shadow-blue-500/50 scale-y-150' 
            : 'bg-transparent'
        }`}
        style={{
          top: position === 'top' ? '0' : 'auto',
          bottom: position === 'bottom' ? '0' : 'auto',
        }}
      />
      {isOver && (
        <div className="absolute inset-x-0 h-0.5 bg-blue-300/30 rounded-full animate-pulse" />
      )}
    </div>
  );
}