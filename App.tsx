
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Transaction, TransactionType, AppState, Category } from './types';
import { INITIAL_TRANSACTIONS, TABS, CATEGORIES, ICON_MAP } from './constants';
import TransactionCard from './components/TransactionCard';
import AddTransactionModal from './components/AddTransactionModal';
import { getFinancialInsights } from './services/geminiService';

declare global {
  interface Window {
    Telegram: any;
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('byn_finance_state_v3');
    if (saved) return JSON.parse(saved);
    return {
      transactions: INITIAL_TRANSACTIONS,
      customCategories: { expense: [], income: [] },
      isAdding: false,
      activeTab: 'dashboard'
    };
  });

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Telegram Initialization
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.headerColor = '#0f172a'; // Match our dark theme
      tg.backgroundColor = '#0f172a';
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('byn_finance_state_v3', JSON.stringify(state));
  }, [state]);

  const stats = useMemo(() => {
    const income = state.transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = state.transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [state.transactions]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('ru-BY', { day: 'numeric', month: 'short' });
      const dayExpense = state.transactions
        .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).toDateString() === date.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: dateStr, value: dayExpense };
    });
  }, [state.transactions]);

  const allExpenseCategories = useMemo(() => [...CATEGORIES.EXPENSE, ...state.customCategories.expense], [state.customCategories.expense]);

  const pieData = useMemo(() => {
    const categories: Record<string, number> = {};
    state.transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories).map(([name, value]) => {
      const cat = allExpenseCategories.find(c => c.name === name);
      return { name, value, color: cat?.color || '#94a3b8' };
    });
  }, [state.transactions, allExpenseCategories]);

  // Handle the interaction with Gemini API to fetch AI financial insights
  const fetchInsights = async () => {
    if (state.transactions.length === 0) {
      setAiInsight("Пожалуйста, добавьте транзакции для проведения анализа.");
      return;
    }
    setIsAiLoading(true);
    try {
      const insight = await getFinancialInsights(state.transactions);
      setAiInsight(insight);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      setAiInsight("Не удалось загрузить рекомендации. Попробуйте еще раз позже.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 relative bg-slate-900 overflow-x-hidden">
      <header className="p-6 bg-gradient-to-b from-indigo-900/30 to-slate-900 rounded-b-[40px] border-b border-indigo-500/10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Finance Pro</h1>
          </div>
          <button 
            onClick={() => setState(prev => ({ ...prev, isAdding: true }))}
            className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-xl shadow-indigo-900/40"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm font-medium mb-1">Ваш баланс</p>
          <h2 className={`text-4xl font-black ${stats.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {stats.balance.toLocaleString('ru-BY')} <span className="text-2xl font-semibold opacity-60">Br</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-effect p-4 rounded-3xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><ArrowUpRight size={18} /></div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Доход</p>
              <p className="font-bold text-emerald-400">+{stats.income.toLocaleString('ru-BY')} Br</p>
            </div>
          </div>
          <div className="glass-effect p-4 rounded-3xl flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl"><ArrowDownRight size={18} /></div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Расход</p>
              <p className="font-bold text-rose-400">-{stats.expense.toLocaleString('ru-BY')} Br</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {state.activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-48 w-full bg-slate-800/20 rounded-3xl p-4 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff'}} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={index === 6 ? '#6366f1' : '#334155'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56 w-full flex items-center justify-center bg-slate-800/20 rounded-3xl p-4 border border-white/5">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-sm">Добавьте транзакции для графика</p>}
            </div>
          </div>
        )}

        {state.activeTab === 'history' && (
          <div className="space-y-1 animate-in slide-in-from-right-4 duration-500">
            {state.transactions.map(t => <TransactionCard key={t.id} transaction={t} />)}
          </div>
        )}

        {state.activeTab === 'insights' && (
          <div className="glass-effect p-8 rounded-[40px] text-center space-y-6 relative overflow-hidden animate-in zoom-in-95">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <RefreshCw size={32} className={`text-indigo-400 ${isAiLoading ? 'animate-spin' : ''}`} onClick={fetchInsights} />
            </div>
            <h3 className="text-2xl font-bold">AI Анализ</h3>
            <p className="text-lg leading-relaxed italic text-slate-300 min-h-[100px]">
              {aiInsight || (isAiLoading ? "Машинный мозг думает..." : "Нажмите, чтобы получить финансовый совет от Gemini")}
            </p>
            {!aiInsight && !isAiLoading && (
              <button onClick={fetchInsights} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-xl">Получить</button>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 glass-effect rounded-[30px] flex items-center justify-around px-4 border border-white/10 z-40">
        {TABS.map(tab => {
          const Icon = ICON_MAP[tab.iconName];
          return (
            <button key={tab.id} onClick={() => setState(p => ({ ...p, activeTab: tab.id as any }))} className={`flex flex-col items-center gap-1 transition-all ${state.activeTab === tab.id ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
              <Icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {state.isAdding && (
        <AddTransactionModal 
          onClose={() => setState(p => ({ ...p, isAdding: false }))} 
          onAdd={(t) => setState(p => ({ ...p, transactions: [t, ...p.transactions] }))}
          customCategories={state.customCategories}
          onAddCategory={(type, cat) => setState(p => ({
            ...p,
            customCategories: {
              ...p.customCategories,
              [type === TransactionType.EXPENSE ? 'expense' : 'income']: [...p.customCategories[type === TransactionType.EXPENSE ? 'expense' : 'income'], cat]
            }
          }))}
        />
      )}
    </div>
  );
};

export default App;
