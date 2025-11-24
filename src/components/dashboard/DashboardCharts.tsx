"use client";

import { useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { AgendaItem } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardChartsProps {
    items: AgendaItem[];
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

// Helper to parse date safely (reused logic)
const parseDate = (dateString: string | number | undefined | null): Date => {
    if (!dateString) return new Date();
    try {
        if (typeof dateString === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            return new Date(excelEpoch.getTime() + dateString * 86400000);
        }
        const dateStr = String(dateString);
        if (dateStr.includes('T')) return new Date(dateStr);
        return new Date(dateStr + 'T00:00:00');
    } catch {
        return new Date();
    }
};

export default function DashboardCharts({ items }: DashboardChartsProps) {
    
    // 1. Monthly Revenue Data
    const revenueData = useMemo(() => {
        const monthlyMap = new Map<string, number>();
        
        items.forEach(item => {
            if (item.status === 'cancelled') return;
            
            const date = parseDate(item.date);
            const key = format(date, 'MMM yyyy', { locale: es }); // e.g., "Nov 2023"
            const sortKey = format(date, 'yyyy-MM'); // For sorting
            
            const current = monthlyMap.get(sortKey) || 0;
            monthlyMap.set(sortKey, current + item.quotedAmount);
        });

        return Array.from(monthlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0])) // Sort by YYYY-MM
            .slice(-6) // Last 6 months
            .map(([key, value]) => {
                const [year, month] = key.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return {
                    name: format(date, 'MMM', { locale: es }),
                    fullDate: format(date, 'MMMM yyyy', { locale: es }),
                    total: value
                };
            });
    }, [items]);

    // 2. Services Distribution Data
    const servicesData = useMemo(() => {
        const serviceMap = new Map<string, number>();
        
        items.forEach(item => {
            if (item.status === 'cancelled') return;
            const current = serviceMap.get(item.service) || 0;
            serviceMap.set(item.service, current + 1);
        });

        return Array.from(serviceMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 services
    }, [items]);

    // 3. Weekly Activity (Last 7 days)
    const activityData = useMemo(() => {
        const daysMap = new Map<string, number>();
        const today = new Date();
        
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = format(d, 'yyyy-MM-dd');
            daysMap.set(key, 0);
        }

        items.forEach(item => {
            const date = parseDate(item.date);
            const key = format(date, 'yyyy-MM-dd');
            if (daysMap.has(key)) {
                daysMap.set(key, (daysMap.get(key) || 0) + 1);
            }
        });

        return Array.from(daysMap.entries()).map(([key, value]) => {
            const date = parseDate(key);
            return {
                name: format(date, 'EEE', { locale: es }), // Mon, Tue...
                fullDate: format(date, 'd MMM', { locale: es }),
                citas: value
            };
        });
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingresos Mensuales</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 12 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                tickFormatter={(value) => `$${value/1000}k`}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f9fafb' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`$${value.toLocaleString('es-MX')}`, 'Ingresos']}
                            />
                            <Bar 
                                dataKey="total" 
                                fill="#3b82f6" 
                                radius={[4, 4, 0, 0]} 
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Services Distribution */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Servicios Más Populares</h3>
                <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={servicesData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {servicesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend 
                                layout="vertical" 
                                verticalAlign="middle" 
                                align="right"
                                iconType="circle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Weekly Activity Area Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad de la Semana (Citas)</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 12 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="citas" 
                                stroke="#8b5cf6" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorCitas)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
