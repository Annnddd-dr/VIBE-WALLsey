'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '@/lib/utils';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  CreditCard,
  Flame,
  PieChart,
  Loader2,
  Calendar,
} from 'lucide-react';

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    aov: number;
    repeatRate: number;
    uniqueCustomers: number;
  };
  timeline: {
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    title: string;
    units: number;
    revenue: number;
    category: string;
  }[];
  categories: {
    name: string;
    revenue: number;
  }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ label: string; revenue: number; orders: number } | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-ink/40">
        <Loader2 size={24} className="animate-spin mb-3 text-accent" />
        <p className="text-xs">Aggregating store performance metrics...</p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-red-500">Failed to load analytics data.</div>;
  }

  const { metrics, timeline, topProducts, categories } = data;

  // Compute SVG chart coordinates
  const maxRevenue = Math.max(...timeline.map((t) => t.revenue), 10000);
  const chartHeight = 180;
  const chartWidth = 700;

  const points = timeline.map((d, idx) => {
    const x = (idx / (timeline.length - 1)) * chartWidth;
    const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  });

  const pathD = `M 0,${chartHeight} L ${points[0]} L ${points.join(' L ')} L ${chartWidth},${chartHeight} Z`;
  const strokeD = `M ${points.join(' L ')}`;

  const totalCatRevenue = categories.reduce((sum, c) => sum + c.revenue, 0) || 1;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-display">Analytics & Performance</h1>
          <p className="text-xs text-ink/50 mt-1">Real-time store metrics over the last 30 days</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink/60 bg-line/40 px-3 py-1.5 rounded-sm border border-line">
          <Calendar size={13} className="text-accent" />
          Last 30 Days
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-line rounded-sm p-5 bg-white shadow-sm">
          <div className="flex items-center justify-between text-ink/40 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">30-Day Revenue</span>
            <TrendingUp size={16} className="text-accent" />
          </div>
          <p className="text-2xl font-display text-ink">{formatINR(metrics.totalRevenue)}</p>
          <p className="text-[11px] text-ink/40 mt-1">{metrics.totalOrders} paid orders</p>
        </div>

        <div className="border border-line rounded-sm p-5 bg-white shadow-sm">
          <div className="flex items-center justify-between text-ink/40 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Order (AOV)</span>
            <CreditCard size={16} className="text-accent" />
          </div>
          <p className="text-2xl font-display text-ink">{formatINR(metrics.aov)}</p>
          <p className="text-[11px] text-ink/40 mt-1">Per transaction average</p>
        </div>

        <div className="border border-line rounded-sm p-5 bg-white shadow-sm">
          <div className="flex items-center justify-between text-ink/40 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag size={16} className="text-accent" />
          </div>
          <p className="text-2xl font-display text-ink">{metrics.totalOrders}</p>
          <p className="text-[11px] text-ink/40 mt-1">Dispatched & fulfillment</p>
        </div>

        <div className="border border-line rounded-sm p-5 bg-white shadow-sm">
          <div className="flex items-center justify-between text-ink/40 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Repeat Rate</span>
            <Users size={16} className="text-accent" />
          </div>
          <p className="text-2xl font-display text-ink">{metrics.repeatRate}%</p>
          <p className="text-[11px] text-ink/40 mt-1">{metrics.uniqueCustomers} unique buyers</p>
        </div>
      </div>

      {/* Revenue Trend Area Chart */}
      <div className="border border-line rounded-sm p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Daily Revenue Trend
            </h2>
            <p className="text-xs text-ink/50 mt-0.5">
              {hoveredDay
                ? `${hoveredDay.label}: ${formatINR(hoveredDay.revenue)} (${hoveredDay.orders} orders)`
                : 'Hover over bars to inspect daily revenue'}
            </p>
          </div>
          <span className="text-xs font-mono text-ink/60 font-medium">
            Peak: {formatINR(maxRevenue)}
          </span>
        </div>

        <div className="relative w-full h-[200px] overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9491C" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#C9491C" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r) => (
              <line
                key={r}
                x1="0"
                y1={chartHeight * r}
                x2={chartWidth}
                y2={chartHeight * r}
                stroke="#E5E3DE"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            ))}

            {/* Area Fill */}
            <path d={pathD} fill="url(#revGrad)" />

            {/* Line */}
            <path d={strokeD} fill="none" stroke="#C9491C" strokeWidth="2.5" strokeLinecap="round" />

            {/* Interactive Data Points */}
            {timeline.map((d, idx) => {
              const x = (idx / (timeline.length - 1)) * chartWidth;
              const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 20) - 10;
              return (
                <circle
                  key={d.date}
                  cx={x}
                  cy={y}
                  r="4"
                  className="fill-white stroke-accent stroke-[2px] hover:r-[6px] transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              );
            })}
          </svg>
        </div>

        {/* Timeline Axis Labels */}
        <div className="flex justify-between text-[10px] text-ink/40 font-mono mt-3 pt-2 border-t border-line/60">
          <span>{timeline[0]?.label}</span>
          <span>{timeline[Math.floor(timeline.length / 2)]?.label}</span>
          <span>{timeline[timeline.length - 1]?.label}</span>
        </div>
      </div>

      {/* Grid: Best Sellers & Category Shares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="border border-line rounded-sm p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Flame size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Top-Selling Prints
            </h2>
          </div>

          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((p, idx) => {
                const maxProdRevenue = topProducts[0]?.revenue || 1;
                const pct = Math.round((p.revenue / maxProdRevenue) * 100);

                return (
                  <div key={p.title}>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="font-medium text-ink flex items-center gap-1.5 truncate max-w-[240px]">
                        <span className="text-ink/30 font-mono text-[11px]">#{idx + 1}</span>
                        {p.title}
                      </span>
                      <span className="font-mono text-ink/80 font-semibold">
                        {formatINR(p.revenue)}
                        <span className="text-[10px] font-normal text-ink/40 ml-1">({p.units} sold)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-line/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-ink/40 italic py-6 text-center">No sales recorded yet.</p>
          )}
        </div>

        {/* Category Share */}
        <div className="border border-line rounded-sm p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <PieChart size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Category Revenue Share
            </h2>
          </div>

          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((c) => {
                const sharePct = Math.round((c.revenue / totalCatRevenue) * 100);

                return (
                  <div key={c.name}>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="font-medium text-ink">{c.name}</span>
                      <span className="font-mono text-ink/70">
                        {sharePct}% <span className="text-ink/40">({formatINR(c.revenue)})</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-line/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ink rounded-full transition-all duration-500"
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-ink/40 italic py-6 text-center">No category data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
