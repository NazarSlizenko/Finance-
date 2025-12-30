
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, LayoutDashboard, History, Sparkles } from 'lucide-react';
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
    const saved = localStorage.getItem('byn_finance_state_v4');
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

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.headerColor = '#0f172a';
      tg.backgroundColor = '#0f172a';
      tg.enableClosingConfirmation();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('byn_finance_state_v4', JSON.stringify(state));
  }, [state]);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  };

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

  const fetchInsights = async () => {
    triggerHaptic('medium');
    if (state.transactions.length === 0) {
      setAiInsight("Пожалуйста, добавьте транзакции для проведения анализа.");
      return;
    }
    setIsAiLoading(true);
    try {
      const insight = await getFinancialInsights(state.transactions);
      setAiInsight(insight);
      triggerHaptic('heavy');
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      setAiInsight("Не удалось загрузить рекомендации. Попробуйте еще раз позже.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  return (
    <div className="min-h-screen pb-28 relative bg-slate-950 overflow-x-hidden text-slate-50">
      <header className="p-6 bg-gradient-to-b from-indigo-950/40 to-slate-950 rounded-b-[48px] border-b border-white/5 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Wallet size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">BYN Tracker</h1>
          </div>
          <button 
            onClick={() => { triggerHaptic('medium'); setState(prev => ({ ...prev, isAdding: true })); }}
            className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-xl shadow-indigo-900/40"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="text-center mb-10">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold mb-2">Общий остаток</p>
          <h2 className={`text-5xl font-black transition-colors duration-500 ${stats.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {stats.balance.toLocaleString('ru-BY')} <span className="text-2xl font-medium opacity-30">Br</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-effect p-4 rounded-[28px] flex items-center gap-3 border-white/10">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl"><ArrowUpRight size={18} /></div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Доход</p>
              <p className="font-bold text-emerald-400">+{stats.income.toLocaleString('ru-BY')}</p>
            </div>
          </div>
          <div className="glass-effect p-4 rounded-[28px] flex items-center gap-3 border-white/10">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl"><ArrowDownRight size={18} /></div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Расход</p>
              <p className="font-bold text-rose-400">-{stats.expense.toLocaleString('ru-BY')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {state.activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Динамика трат</h3>
              <div className="h-52 w-full glass-effect rounded-[32px] p-5 border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '12px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                      {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={index === 6 ? '#6366f1' : '#1e293b'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Структура расходов</h3>
              <div className="h-60 w-full flex items-center justify-center glass-effect rounded-[32px] p-5 border-white/5">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '12px', color: '#fff'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-600 text-sm italic">Пока нет данных для графика</p>}
              </div>
            </div>
          </div>
        )}

        {state.activeTab === 'history' && (
          <div className="space-y-2 animate-in slide-in-from-right-4 duration-500">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-1">Последние операции</h3>
            {state.transactions.length > 0 ? (
              state.transactions.map(t => (
                <TransactionCard 
                  key={t.id} 
                  transaction={t} 
                  onDelete={handleDeleteTransaction}
                />
              ))
            ) : (
              <div className="py-20 text-center opacity-30">
                <History size={48} className="mx-auto mb-4" />
                <p>История пуста</p>
              </div>
            )}
          </div>
        )}

        {state.activeTab === 'insights' && (
          <div className="glass-effect p-10 rounded-[48px] text-center space-y-8 relative overflow-hidden animate-in zoom-in-95 border-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            <div className="w-24 h-24 bg-indigo-600/10 rounded-[32px] flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-2xl shadow-indigo-500/5">
              <RefreshCw size={40} className={`text-indigo-400 ${isAiLoading ? 'animate-spin' : ''}`} onClick={fetchInsights} />
            </div>
            <h3 className="text-2xl font-black tracking-tight">AI Консультант</h3>
            <div className="min-h-[140px] flex items-center justify-center">
              {isAiLoading ? (
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                </div>
              ) : (
                <p className="text-lg leading-relaxed text-slate-300 font-medium">
                  {aiInsight || "Нажмите на кнопку ниже, чтобы наш AI проанализировал ваши финансы."}
                </p>
              )}
            </div>
            {!aiInsight && !isAiLoading && (
              <button 
                onClick={fetchInsights} 
                className="w-full bg-indigo-600 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-900/30 active:scale-95 transition-all"
              >
                Получить совет
              </button>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-8 right-8 h-20 glass-effect rounded-[32px] flex items-center justify-around px-6 border border-white/10 z-40 shadow-2xl">
        <button onClick={() => { triggerHaptic(); setState(p => ({ ...p, activeTab: 'dashboard' })); }} className={`flex flex-col items-center gap-1.5 transition-all ${state.activeTab === 'dashboard' ? 'text-indigo-400 scale-110' : 'text-slate-600'}`}>
          <LayoutDashboard size={22} />
          <span className="text-[9px] font-black uppercase tracking-widest">Обзор</span>
        </button>
        <button onClick={() => { triggerHaptic(); setState(p => ({ ...p, activeTab: 'history' })); }} className={`flex flex-col items-center gap-1.5 transition-all ${state.activeTab === 'history' ? 'text-indigo-400 scale-110' : 'text-slate-600'}`}>
          <History size={22} />
          <span className="text-[9px] font-black uppercase tracking-widest">История</span>
        </button>
        <button onClick={() => { triggerHaptic(); setState(p => ({ ...p, activeTab: 'insights' })); }} className={`flex flex-col items-center gap-1.5 transition-all ${state.activeTab === 'insights' ? 'text-indigo-400 scale-110' : 'text-slate-600'}`}>
          <Sparkles size={22} />
          <span className="text-[9px] font-black uppercase tracking-widest">Советы</span>
        </button>
      </nav>

      {state.isAdding && (
        <AddTransactionModal 
          onClose={() => { triggerHaptic(); setState(p => ({ ...p, isAdding: false })); }} 
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
