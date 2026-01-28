'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

type Row = {
  day: number;      // 1..31
  sales: number;    // ventas del día
  expenses: number; // gastos del día
};

export function FinanceMonthChart({ data }: { data: Row[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="sales" name="Ventas" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expenses" name="Gastos" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
