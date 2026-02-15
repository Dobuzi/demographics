import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  return (
    <>
      <header className="border-b border-zinc-800 px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white tracking-tight">
            Stock Dashboard
          </h1>
          <span className="text-xs text-zinc-500">
            Powered by Alpha Vantage &amp; Finnhub
          </span>
        </div>
      </header>
      <Dashboard />
      <footer className="border-t border-zinc-800 px-4 py-3 text-center text-xs text-zinc-600">
        Data provided by Alpha Vantage and Finnhub. Not financial advice.
      </footer>
    </>
  );
}
