import { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Package, 
  ShoppingCart, 
  AlertTriangle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Jan', sales: 4000, production: 2400 },
  { name: 'Feb', sales: 3000, production: 1398 },
  { name: 'Mar', sales: 2000, production: 9800 },
  { name: 'Apr', sales: 2780, production: 3908 },
  { name: 'May', sales: 1890, production: 4800 },
  { name: 'Jun', sales: 2390, production: 3800 },
];

export default function Dashboard() {
  const api = useApi();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.get('/dashboard/metrics');
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div>Loading...</div>;

  const stats = [
    { label: 'Total Revenue', value: `₹${metrics?.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12.5%', trendUp: true },
    { label: 'Total Sales', value: metrics?.salesCount, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+5.2%', trendUp: true },
    { label: 'Low Stock Items', value: metrics?.lowStockCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-2', trendUp: false },
    { label: 'Active Production', value: metrics?.activeProduction, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+3', trendUp: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Dashboard Overview</h1>
        <div className="flex gap-2">
          <button className="rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
            Last 30 Days
          </button>
          <button className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-md hover:bg-indigo-700">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={cn("rounded-lg p-2", stat.bg)}>
                <stat.icon className={stat.color} size={20} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold",
                stat.trendUp ? "text-emerald-600" : "text-amber-600"
              )}>
                {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <h3 className="mt-0.5 text-xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-2 text-sm font-bold text-slate-900">Sales Performance</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-2 text-sm font-bold text-slate-900">Production vs Sales</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[2, 2, 0, 0]} barSize={16} />
                <Bar dataKey="production" fill="#e2e8f0" radius={[2, 2, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
