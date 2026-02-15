'use client';

import { FinancialStatement } from '@/types';
import { formatLargeNumber } from '@/lib/transformers';

interface FinancialTableProps {
  statement: FinancialStatement;
}

export function FinancialTable({ statement }: FinancialTableProps) {
  if (statement.rows.length === 0 || statement.dates.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-700/50 p-6 text-center text-sm text-zinc-500">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="sticky left-0 bg-zinc-900 py-2 pr-4 text-left font-medium text-zinc-400 z-10">
              Metric
            </th>
            {statement.dates.map((date) => (
              <th
                key={date}
                className="min-w-[100px] py-2 px-3 text-right font-medium text-zinc-400"
              >
                {date}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statement.rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
            >
              <td className="sticky left-0 bg-zinc-900 py-2 pr-4 text-zinc-300 font-medium z-10">
                {row.label}
              </td>
              {row.values.map((val, i) => (
                <td
                  key={i}
                  className={`py-2 px-3 text-right tabular-nums ${
                    val !== null && val < 0 ? 'text-red-400' : 'text-zinc-300'
                  }`}
                >
                  {formatLargeNumber(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
