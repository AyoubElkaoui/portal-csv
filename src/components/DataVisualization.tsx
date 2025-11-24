'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

type Invoice = {
  id: string;
  factuurnummer: string;
  relatienaam: string;
  factuurdatum: string;
  bedragExcl: number;
  btw: number;
  factuurbedrag: number;
  openstaandeBedrag: number;
  betalingstermijn: number;
  aantalDagenOpen: number;
  akkoord: boolean;
  afgewezen: boolean;
  opmerkingen: string | null;
};

type Upload = {
  id: string;
  filename: string;
  uploadedAt: string;
  invoices: Invoice[];
};

interface DataVisualizationProps {
  uploads: Upload[];
  className?: string;
}

const COLORS = {
  approved: '#10B981', // green-500
  rejected: '#EF4444', // red-500
  denied: '#F59E0B', // amber-500
  pending: '#6B7280', // gray-500
};

export function DataVisualization({ uploads, className = '' }: DataVisualizationProps) {
  // Calculate statistics from all invoices
  const allInvoices = uploads.flatMap(upload => upload.invoices);

  // Monthly approval trends
  const monthlyData = React.useMemo(() => {
    const monthlyStats: { [key: string]: { total: number; approved: number; rejected: number; denied: number; totalAmount: number } } = {};

    allInvoices.forEach(invoice => {
      const date = new Date(invoice.factuurdatum);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { total: 0, approved: 0, rejected: 0, denied: 0, totalAmount: 0 };
      }

      monthlyStats[monthKey].total++;
      monthlyStats[monthKey].totalAmount += invoice.factuurbedrag;

      if (invoice.afgewezen) {
        monthlyStats[monthKey].denied++;
      } else if (invoice.akkoord) {
        monthlyStats[monthKey].approved++;
      } else {
        monthlyStats[monthKey].rejected++;
      }
    });

    return Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month: new Date(month + '-01').toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }),
        total: stats.total,
        approved: stats.approved,
        rejected: stats.rejected,
        denied: stats.denied,
        approvalRate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
        averageAmount: stats.total > 0 ? Math.round(stats.totalAmount / stats.total) : 0
      }));
  }, [allInvoices]);

  // Status distribution
  const statusData = React.useMemo(() => {
    const stats = { approved: 0, rejected: 0, denied: 0 };

    allInvoices.forEach(invoice => {
      if (invoice.afgewezen) {
        stats.denied++;
      } else if (invoice.akkoord) {
        stats.approved++;
      } else {
        stats.rejected++;
      }
    });

    return [
      {
        name: 'Goedgekeurd',
        value: stats.approved,
        percentage: allInvoices.length > 0 ? Math.round((stats.approved / allInvoices.length) * 100) : 0,
        color: COLORS.approved,
        amount: allInvoices.filter(i => i.akkoord && !i.afgewezen).reduce((sum, i) => sum + i.factuurbedrag, 0)
      },
      {
        name: 'Afgekeurd',
        value: stats.rejected,
        percentage: allInvoices.length > 0 ? Math.round((stats.rejected / allInvoices.length) * 100) : 0,
        color: COLORS.rejected,
        amount: allInvoices.filter(i => !i.akkoord && !i.afgewezen).reduce((sum, i) => sum + i.factuurbedrag, 0)
      },
      {
        name: 'Afgewezen',
        value: stats.denied,
        percentage: allInvoices.length > 0 ? Math.round((stats.denied / allInvoices.length) * 100) : 0,
        color: COLORS.denied,
        amount: allInvoices.filter(i => i.afgewezen).reduce((sum, i) => sum + i.factuurbedrag, 0)
      }
    ];
  }, [allInvoices]);

  // Amount distribution (histogram)
  const amountRanges = React.useMemo(() => {
    const ranges = [
      { min: 0, max: 100, label: '€0-100' },
      { min: 100, max: 500, label: '€100-500' },
      { min: 500, max: 1000, label: '€500-1000' },
      { min: 1000, max: 5000, label: '€1000-5000' },
      { min: 5000, max: 10000, label: '€5000-10000' },
      { min: 10000, max: Infinity, label: '€10000+' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: allInvoices.filter(invoice =>
        invoice.factuurbedrag >= range.min && invoice.factuurbedrag < range.max
      ).length,
      amount: allInvoices
        .filter(invoice => invoice.factuurbedrag >= range.min && invoice.factuurbedrag < range.max)
        .reduce((sum, invoice) => sum + invoice.factuurbedrag, 0)
    }));
  }, [allInvoices]);

  // Days open distribution
  const daysOpenData = React.useMemo(() => {
    const ranges = [
      { min: 0, max: 7, label: '0-7 dagen' },
      { min: 7, max: 14, label: '7-14 dagen' },
      { min: 14, max: 30, label: '14-30 dagen' },
      { min: 30, max: 60, label: '30-60 dagen' },
      { min: 60, max: 90, label: '60-90 dagen' },
      { min: 90, max: Infinity, label: '90+ dagen' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: allInvoices.filter(invoice =>
        invoice.aantalDagenOpen >= range.min && invoice.aantalDagenOpen < range.max
      ).length
    }));
  }, [allInvoices]);

  const totalInvoices = allInvoices.length;
  const totalAmount = allInvoices.reduce((sum, invoice) => sum + invoice.factuurbedrag, 0);
  const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;
  const approvalRate = totalInvoices > 0 ? Math.round((allInvoices.filter(i => i.akkoord && !i.afgewezen).length / totalInvoices) * 100) : 0;

  if (totalInvoices === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Data Visualisatie</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">Geen data beschikbaar voor visualisatie</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalInvoices}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Totaal Facturen</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">€{totalAmount.toLocaleString('nl-NL')}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Totaal Bedrag</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">€{averageAmount.toFixed(0)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Gemiddeld Bedrag</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{approvalRate}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Goedkeuringspercentage</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Maandelijkse Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="approved"
                stackId="1"
                stroke={COLORS.approved}
                fill={COLORS.approved}
                name="Goedgekeurd"
              />
              <Area
                type="monotone"
                dataKey="rejected"
                stackId="1"
                stroke={COLORS.rejected}
                fill={COLORS.rejected}
                name="Afgekeurd"
              />
              <Area
                type="monotone"
                dataKey="denied"
                stackId="1"
                stroke={COLORS.denied}
                fill={COLORS.denied}
                name="Afgewezen"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Status Distributie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name }) => {
                  const item = statusData.find(d => d.name === name);
                  return item ? `${name}: ${item.percentage}%` : name;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number, name: string) => [
                  `${value} facturen (${statusData.find(d => d.name === name)?.percentage}%)`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Amount Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Bedrag Distributie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={amountRanges}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number, name: string) => [
                  name === 'count' ? `${value} facturen` : `€${value.toLocaleString('nl-NL')}`,
                  name === 'count' ? 'Aantal' : 'Totaal Bedrag'
                ]}
              />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name="Aantal Facturen" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Days Open Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Dagen Open Distributie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={daysOpenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [`${value} facturen`, 'Aantal']}
              />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Approval Rate Trend */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Goedkeuringspercentage Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: number) => [`${value}%`, 'Goedkeuringspercentage']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="approvalRate"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Goedkeuringspercentage"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}