import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cmsAPI } from '../../lib/api';
import {
  TrendingUp, TrendingDown, Users, Target, Zap,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, Download
} from 'lucide-react';

const STAGE_TYPES = [
  { type: 'landing', name: 'Landing', color: 'blue' },
  { type: 'story', name: 'Story', color: 'purple' },
  { type: 'social_proof', name: 'Social Proof', color: 'green' },
  { type: 'offer', name: 'Offer', color: 'orange' },
  { type: 'urgency', name: 'Urgency', color: 'red' },
  { type: 'thank_you', name: 'Thank You', color: 'emerald' },
];

// Mock analytics data (in production, this would come from analytics API)
const generateMockAnalytics = (funnelId, dateRange) => {
  const baseVisitors = 1000 + Math.floor(Math.random() * 500);
  const stages = STAGE_TYPES.map((stage, index) => {
    const dropRate = 0.15 + Math.random() * 0.1; // 15-25% drop per stage
    const visitors = Math.floor(baseVisitors * Math.pow(1 - dropRate, index));
    const conversions = Math.floor(visitors * (0.7 + Math.random() * 0.25));

    return {
      ...stage,
      visitors,
      conversions,
      conversionRate: Math.round((conversions / visitors) * 100),
      avgTimeOnStage: Math.floor(30 + Math.random() * 90), // seconds
      bounceRate: Math.floor(10 + Math.random() * 20),
    };
  });

  const totalVisitors = stages[0].visitors;
  const totalConversions = stages[stages.length - 1].conversions;
  const overallConversionRate = Math.round((totalConversions / totalVisitors) * 100);

  return {
    summary: {
      totalVisitors,
      totalConversions,
      overallConversionRate,
      avgOrderValue: 45 + Math.floor(Math.random() * 30),
      revenue: totalConversions * (45 + Math.floor(Math.random() * 30)),
      change: Math.floor(Math.random() * 30) - 10, // -10% to +20%
    },
    stages,
    topDropoffs: stages
      .slice(0, -1)
      .map((stage, index) => ({
        from: stage.name,
        to: stages[index + 1].name,
        dropRate: Math.round((1 - stages[index + 1].visitors / stage.visitors) * 100),
      }))
      .sort((a, b) => b.dropRate - a.dropRate)
      .slice(0, 3),
  };
};

/**
 * MetricCard - Display a single metric with trend
 */
function MetricCard({ title, value, change, prefix = '', suffix = '', icon: Icon }) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
        <span className={`flex items-center text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}

/**
 * StagePerformanceBar - Horizontal bar for stage conversion
 */
function StagePerformanceBar({ stage, maxVisitors }) {
  const widthPercent = (stage.visitors / maxVisitors) * 100;

  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 flex-shrink-0">
        <p className="font-medium text-gray-900 text-sm">{stage.name}</p>
        <p className="text-xs text-gray-500">{stage.visitors.toLocaleString()} visitors</p>
      </div>
      <div className="flex-1">
        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
          <div
            className={`h-full ${colorClasses[stage.color] || 'bg-blue-500'} transition-all duration-500`}
            style={{ width: `${widthPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-end pr-3">
            <span className="text-xs font-semibold text-gray-700">
              {stage.conversionRate}% conv.
            </span>
          </div>
        </div>
      </div>
      <div className="w-20 text-right">
        <p className="text-sm font-semibold text-green-600">{stage.conversions}</p>
        <p className="text-xs text-gray-500">conversions</p>
      </div>
    </div>
  );
}

/**
 * FunnelAnalytics - Analytics dashboard for funnels
 */
export function FunnelAnalytics({ funnelId }) {
  const [dateRange, setDateRange] = useState('7d');

  // In production, fetch real analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['funnelAnalytics', funnelId, dateRange],
    queryFn: () => generateMockAnalytics(funnelId, dateRange),
    staleTime: 60 * 1000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { summary, stages, topDropoffs } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Funnel Analytics</h3>
          <p className="text-sm text-gray-600">Performance metrics and conversion data</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Visitors"
          value={summary?.totalVisitors}
          change={summary?.change || 0}
          icon={Users}
        />
        <MetricCard
          title="Conversions"
          value={summary?.totalConversions}
          change={(summary?.change || 0) + 5}
          icon={Target}
        />
        <MetricCard
          title="Conversion Rate"
          value={summary?.overallConversionRate}
          suffix="%"
          change={(summary?.change || 0) + 2}
          icon={TrendingUp}
        />
        <MetricCard
          title="Revenue"
          value={summary?.revenue}
          prefix="$"
          change={(summary?.change || 0) + 8}
          icon={BarChart3}
        />
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Stage Performance
          </h4>
          <span className="text-sm text-gray-500">
            Visitors through each stage
          </span>
        </div>

        <div className="space-y-4">
          {stages?.map((stage, index) => (
            <StagePerformanceBar
              key={stage.type}
              stage={stage}
              maxVisitors={stages[0].visitors}
            />
          ))}
        </div>
      </div>

      {/* Top Drop-offs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Top Drop-off Points
          </h4>
          <div className="space-y-3">
            {topDropoffs?.map((dropoff, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {dropoff.from} → {dropoff.to}
                  </p>
                  <p className="text-sm text-gray-600">Stage transition</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{dropoff.dropRate}%</p>
                  <p className="text-xs text-gray-500">drop rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Optimization Tips
          </h4>
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="font-medium text-purple-900">Improve Social Proof</p>
              <p className="text-sm text-purple-700">
                Add more customer testimonials to reduce the {topDropoffs?.[0]?.dropRate || 20}% drop-off
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">A/B Test Headlines</p>
              <p className="text-sm text-blue-700">
                Test different headlines on your Landing stage for higher engagement
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900">Add Urgency Elements</p>
              <p className="text-sm text-green-700">
                Consider adding countdown timers or limited stock indicators
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FunnelAnalytics;
