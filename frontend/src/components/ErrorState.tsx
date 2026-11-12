export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="animate-scale-in rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-soft" role="alert">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l9.5 16h-19zM12 10v4M12 17.5h.01" /></svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-rose-800">Something went wrong</p>
          <p className="mt-1 text-sm text-rose-700">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-95"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
