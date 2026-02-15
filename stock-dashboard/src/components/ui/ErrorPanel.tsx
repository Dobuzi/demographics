'use client';

interface ErrorPanelProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div
      className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm"
      role="alert"
    >
      <div className="flex items-center justify-between">
        <p className="text-red-400">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 rounded bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function WarningPanel({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300"
      role="status"
    >
      {message}
    </div>
  );
}
