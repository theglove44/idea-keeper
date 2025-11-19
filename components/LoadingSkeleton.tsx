import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'button';
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'text',
  lines = 1
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 skeleton rounded"
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-4 bg-surface-elevated rounded-xl border border-border ${className}`}>
        <div className="skeleton h-6 w-3/4 rounded mb-3" />
        <div className="skeleton h-4 w-full rounded mb-2" />
        <div className="skeleton h-4 w-5/6 rounded" />
      </div>
    );
  }

  if (variant === 'circle') {
    return <div className={`skeleton rounded-full ${className}`} />;
  }

  if (variant === 'button') {
    return <div className={`skeleton h-10 w-24 rounded-lg ${className}`} />;
  }

  return <div className={`skeleton h-4 rounded ${className}`} />;
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-brand-purple-500 border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
};

interface LoadingCardProps {
  count?: number;
}

export const LoadingCards: React.FC<LoadingCardProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 bg-surface-elevated/50 border border-border/50 rounded-lg"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="skeleton h-4 w-full rounded mb-2" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
};
