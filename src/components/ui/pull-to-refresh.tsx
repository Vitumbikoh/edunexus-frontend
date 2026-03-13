import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  pullThreshold?: number;
  refreshThreshold?: number;
  offsetTop?: number; // push indicator lower if header overlaps
  showText?: boolean; // optionally hide instructional text
  showIndicator?: boolean; // hide indicator UI entirely while keeping functionality
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  pullThreshold = 60,
  refreshThreshold = 80,
  offsetTop = 0,
  showText = true,
  showIndicator = true,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    const scrollTop = containerRef.current?.scrollTop || 0;
    
    if (scrollTop === 0) {
      startY.current = touch.clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const pullDistance = Math.max(0, currentY - startY.current);
    
    if (pullDistance > 0) {
      e.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(pullDistance, pullThreshold * 2));
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, disabled, isRefreshing]);

  const pullProgress = Math.min(pullDistance / refreshThreshold, 1);
  const shouldRefresh = pullDistance >= refreshThreshold;

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull to refresh indicator */}
      {showIndicator && (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 flex items-center justify-center bg-white dark:bg-card transition-transform duration-200 z-40 px-4",
            isPulling || isRefreshing ? 'transform translate-y-0' : 'transform -translate-y-full'
          )}
          style={{
            top: offsetTop,
            height: isPulling ? Math.min(pullDistance, pullThreshold) : isRefreshing ? pullThreshold : 0,
          }}
          aria-hidden={!(isPulling || isRefreshing)}
        >
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            {/* Icon removed when indicator is hidden via prop; retain spinner only when indicator shown */}
            <RefreshCw
              className={cn(
                "h-5 w-5 transition-transform",
                isRefreshing ? 'animate-spin' : '',
                shouldRefresh ? 'rotate-180' : ''
              )}
              style={{
                transform: !isRefreshing && isPulling ? `rotate(${pullProgress * 180}deg)` : undefined
              }}
            />
            {showText && (
              <span className="ml-2 text-sm font-medium">
                {isRefreshing
                  ? 'Refreshing...'
                  : shouldRefresh
                  ? 'Release to refresh'
                  : 'Pull to refresh'
                }
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "transition-transform duration-200",
          isPulling || isRefreshing ? 'transform' : ''
        )}
        style={{
          transform: isPulling || isRefreshing 
            ? `translateY(${Math.min(pullDistance, pullThreshold)}px)` 
            : undefined
        }}
      >
        {children}
      </div>
    </div>
  );
};