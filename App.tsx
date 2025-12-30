
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        headerColor: string;
        backgroundColor: string;
        enableClosingConfirmation: () => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
      };
    };
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('byn_finance_state_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Storage load failed", e);
    }
    return {
      transactions: INITIAL_TRANSACTIONS,
      customCategories: { expense: [], income: [] },
      isAdding: false,
      activeTab: 'dashboard'
    };
  });

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log("App component mounted");
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.headerColor = '#0f172a';
      tg.backgroundColor = '#0f172a';
      tg.enableClosingConfirmation();
    }
    // Небольшая задержка для корректного расчета размеров графиков и отрисовки
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log("App ready state set to true");
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('byn_finance_state_v5', JSON.stringify(state));
  }, [state]);

  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  }, []);

  const stats = useMemo(() => {
    const income = state.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = state.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
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

  const allExpenseCategories = useMemo(() => [
    ...CATEGORIES.EXPENSE, 
    ...state.customCategories.expense
  ], [state.customCategories.expense]);

  const pieData = useMemo(() => {
    const categories: Record<string, number> = {};
    const expenses = state.transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenses.length === 0) return [];

    expenses.forEach(t => {
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
      setAiInsight("Нет данных для анализа.");
      return;
    }
    setIsAiLoading(true);
    try {
      const insight = await getFinancialInsights(state.transactions);
      setAiInsight(insight);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      setAiInsight("Ошибка загрузки советов.");
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteTransaction = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  }, []);

  const switchTab = (tab: 'dashboard' | 'history' | 'insights') => {
    if (state.activeTab !== tab) {
      triggerHaptic('light');
      setState(p => ({ ...p, activeTab: tab }));
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-slate-500 animate-pulse text-sm font-medium">Загрузка BYN Tracker...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 relative bg-slate-950 overflow-x-hidden text-slate-50">
      <header className="p-6 bg-gradient-to-b from-indigo-950/40 to-slate-950 rounded-b-[40px] border-b border-white/5 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Wallet size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">BYN Tracker</h1>
          </div>
          <button 
            onClick={() => { triggerHaptic('medium'); setState(prev => ({ ...prev, isAdding: true })); }}
            className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-xl shadow-indigo-900/40"
          >
            <Plus size={22} />
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Баланс</p>
          <h2 className={`text-4xl font-black transition-colors duration-500 ${stats.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {stats.balance.toLocaleString('ru-BY')} <span className="text-xl font-medium opacity-30">Br</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-effect p-3 rounded-2xl flex items-center gap-2 border-white/10">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><ArrowUpRight size={16} /></div>
            <div className="overflow-hidden">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Доход</p>
              <p className="text-sm font-bold text-emerald-400 truncate">+{stats.income.toLocaleString('ru-BY')}</p>
            </div>
          </div>
          <div className="glass-effect p-3 rounded-2xl flex items-center gap-2 border-white/10">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><ArrowDownRight size={16} /></div>
            <div className="overflow-hidden">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Расход</p>
              <p className="text-sm font-bold text-rose-400 truncate">-{stats.expense.toLocaleString('ru-BY')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {state.activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Траты (7 дн.)</h3>
              <div className="h-48 w-full glass-effect rounded-3xl p-4 border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 9}} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff'}} />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                      {chartData.map((_, index) => (
                        <Cell key={`bar-cell-${index}`} fill={index === 6 ? '#6366f1' : '#1e293b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Категории</h3>
              <div className="h-56 w-full flex items-center justify-center glass-effect rounded-3xl p-4 border-white/5">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={55} 
                        outerRadius={75} 
                        paddingAngle={5} 
                        dataKey="value" 
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-600 text-xs italic">Нет данных для диаграммы</p>}
              </div>
            </div>
          </div>
        )}

        {state.activeTab === 'history' && (
          <div className="space-y-2 animate-in slide-in-from-right-2 duration-500">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-1">Последние операции</h3>
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
                <History size={40} className="mx-auto mb-3" />
                <p className="text-sm">История пуста</p>
              </div>
            )}
          </div>
        )}

        {state.activeTab === 'insights' && (
          <div className="glass-effect p-8 rounded-[32px] text-center space-y-6 relative overflow-hidden animate-in zoom-in-95 border-white/10">
            <div className="w-20 h-20 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-indigo-500/10 shadow-xl">
              <Sparkles size={32} className={`text-indigo-400 ${isAiLoading ? 'animate-pulse' : ''}`} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">AI Консультант</h3>
            <div className="min-h-[120px] flex items-center justify-center px-2">
              {isAiLoading ? (
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-slate-300">
                  {aiInsight || "Проанализируйте свои финансы с помощью искусственного интеллекта."}
                </p>
              )}
            </div>
            {!isAiLoading && (
              <button 
                onClick={fetchInsights} 
                className="w-full bg-indigo-600 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
              >
                {aiInsight ? 'Обновить анализ' : 'Получить анализ'}
              </button>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 glass-effect rounded-[28px] flex items-center justify-around px-4 border border-white/10 z-40 shadow-2xl">
        <button onClick={() => switchTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${state.activeTab === 'dashboard' ? 'text-indigo-400 scale-105' : 'text-slate-600'}`}>
          <LayoutDashboard size={22} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Обзор</span>
        </button>
        <button onClick={() => switchTab('history')} className={`flex flex-col items-center gap-1.5 transition-all ${state.activeTab === 'history' ? 'text-indigo-400 scale-105' : 'text-slate-600'}`}>
          <History size={22} />
          <span className="text-[9px] font-bold uppercase tracking-widest">История</span>
        </button>
        <button onClick={() => switchTab('insights')} className={`flex flex-col items-center gap-1.5 transition-all ${state.activeTab === 'insights' ? 'text-indigo-400 scale-105' : 'text-slate-600'}`}>
          <Sparkles size={22} />
          <span className="text-[9px] font-bold uppercase tracking-widest">AI Советы</span>
        </button>
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
