import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { useOptionalSystemPreloader } from '@/contexts/SystemPreloaderContext';
import { useOptionalSidebar } from '@/contexts/SidebarContext';

interface PreloaderProps {
  /**
   * Variant of the preloader
   * - spinner: Shows a spinning loader icon
   * - skeleton: Shows skeleton placeholders
   * - dots: Shows animated dots
   * - text: Shows simple loading text
   */
  variant?: 'spinner' | 'skeleton' | 'dots' | 'text';
  
  /**
   * Size of the preloader
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Custom text to display (only applies to text and dots variants)
   */
  text?: string;
  
  /**
   * Additional className for styling
   */
  className?: string;
  
  /**
   * Whether to center the preloader
   */
  centered?: boolean;
  
  /**
   * Number of skeleton rows (only applies to skeleton variant)
   */
  rows?: number;
  
  /**
   * Height of the preloader container
   */
  height?: string | number;
  
  /**
   * Full screen overlay preloader
   */
  fullScreen?: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({
  variant = 'spinner',
  size = 'md',
  text = 'Loading...',
  className,
  centered = true,
  rows = 3,
  height,
  fullScreen = false,
}) => {
  const systemPreloader = useOptionalSystemPreloader();

  // Enforce a single loader across the app: when global system preloader is active,
  // suppress local page/table/card preloaders to avoid duplicate loaders.
  if (systemPreloader?.isVisible) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const containerClasses = cn(
    'flex items-center justify-center',
    centered && 'w-full',
    fullScreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
    className
  );

  const containerStyle = height ? { height: typeof height === 'number' ? `${height}px` : height } : {};

  if (variant === 'spinner') {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
          {text && (
            <p className={cn('text-muted-foreground', textSizeClasses[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3 p-4', className)} style={containerStyle}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={cn(
                  'bg-primary rounded-full animate-pulse',
                  size === 'sm' && 'h-1 w-1',
                  size === 'md' && 'h-2 w-2',
                  size === 'lg' && 'h-3 w-3'
                )}
                style={{
                  animationDelay: `${index * 0.15}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
          {text && (
            <p className={cn('text-muted-foreground', textSizeClasses[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // text variant
  return (
    <div className={containerClasses} style={containerStyle}>
      <p className={cn('text-muted-foreground', textSizeClasses[size])}>
        {text}
      </p>
    </div>
  );
};

// Specialized preloader components for common use cases
export const TablePreloader: React.FC<{ colSpan?: number; text?: string }> = ({ 
  colSpan = 5, 
  text = 'Loading...' 
}) => (
  <tr>
    <td colSpan={colSpan} className="py-8 text-center">
      <Preloader variant="spinner" size="md" text={text} />
    </td>
  </tr>
);

export const CardPreloader: React.FC<{ height?: string | number; text?: string }> = ({ 
  height = '16rem', 
  text = 'Loading...' 
}) => (
  <div className="flex items-center justify-center border rounded-lg" style={{ height }}>
    <Preloader variant="spinner" size="md" text={text} />
  </div>
);

export const PagePreloader: React.FC<{ text?: string }> = ({ text = 'Loading page...' }) => (
  <Preloader variant="spinner" size="lg" text={text} height="50vh" />
);

export const FullScreenPreloader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <Preloader variant="spinner" size="lg" text={text} fullScreen />
);

export const SystemPreloader: React.FC<{
  text?: string;
  subtext?: string;
  visible?: boolean;
}> = ({
  text = 'Loading system data',
  subtext = 'Please wait while we fetch your information',
  visible = true,
}) => {
  const sidebar = useOptionalSidebar();

  if (!visible) {
    return null;
  }

  const hasDesktopLayout = typeof window !== 'undefined'
    ? window.matchMedia('(min-width: 1280px)').matches
    : true;

  const contentInsetTop = sidebar ? 64 : 0;
  const contentInsetLeft = sidebar
    ? (hasDesktopLayout ? (sidebar.isOpen ? 256 : 80) : 0)
    : 0;

  return (
    <div
      className="fixed z-[120] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      style={{
        top: contentInsetTop,
        left: contentInsetLeft,
        right: 0,
        bottom: 0,
      }}
    >
      <div className="w-[min(92vw,24rem)] rounded-xl border bg-card/95 p-6 shadow-lg">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>

        <div className="text-center">
          <h3 className="text-base font-semibold text-foreground">{text}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>
        </div>

        <div className="mt-5 space-y-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: '0.12s' }}
            />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: '0.24s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Preloader };