
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, LayoutDashboard, History, Sparkles } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Transaction, TransactionType, AppState } from './types';
import { INITIAL_TRANSACTIONS, CATEGORIES } from './constants';
import TransactionCard from './components/TransactionCard';
import AddTransactionModal from './components/AddTransactionModal';
import { getFinancialInsights } from './services/geminiService';

declare global {
  interface Window {
    Telegram: { WebApp: any };
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('byn_finance_pro_v1');
    return saved ? JSON.parse(saved) : {
      transactions: INITIAL_TRANSACTIONS,
      customCategories: { expense: [], income: [] },
      isAdding: false,
      activeTab: 'dashboard'
    };
  });

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.headerColor = '#0f172a';
      tg.backgroundColor = '#0f172a';
    }
    setTimeout(() => setIsAppReady(true), 150);
  }, []);

  useEffect(() => {
    localStorage.setItem('byn_finance_pro_v1', JSON.stringify(state));
  }, [state]);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  };

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
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString('ru-BY', { day: 'numeric', month: 'short' });
      const val = state.transactions
        .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).toDateString() === d.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: label, value: val };
    });
  }, [state.transactions]);

  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    const expenses = state.transactions.filter(t => t.type === TransactionType.EXPENSE);
    expenses.forEach(t => cats[t.category] = (cats[t.category] || 0) + t.amount);
    return Object.entries(cats).map(([name, value]) => ({
      name, value, 
      color: [...CATEGORIES.EXPENSE, ...state.customCategories.expense].find(c => c.name === name)?.color || '#475569'
    }));
  }, [state.transactions, state.customCategories.expense]);

  const handleFetchInsights = async () => {
    triggerHaptic('medium');
    setIsAiLoading(true);
    const insight = await getFinancialInsights(state.transactions);
    setAiInsight(insight);
    setIsAiLoading(false);
  };

  if (!isAppReady) return null;

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      <header className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 rounded-b-[40px] border-b border-white/5">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Wallet className="text-white" size={20} />
            </div>
            <span className="font-bold text-lg">BYN Pro</span>
          </div>
          <button 
            onClick={() => { triggerHaptic('medium'); setState(s => ({ ...s, isAdding: true })); }}
            className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus className="text-white" size={24} />
          </button>
        </div>

        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Общий баланс</p>
          <h1 className="text-4xl font-black">{stats.balance.toLocaleString('ru-BY')} <span className="text-lg opacity-30 font-medium">Br</span></h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><ArrowUpRight size={16} /></div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Доходы</p>
              <p className="font-bold text-emerald-400">+{stats.income.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><ArrowDownRight size={16} /></div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Расходы</p>
              <p className="font-bold text-rose-400">-{stats.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {state.activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Динамика трат</h3>
              <div className="h-44 glass rounded-3xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 9}} />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                      {chartData.map((_, i) => <Cell key={i} fill={i === 6 ? '#6366f1' : '#1e293b'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Категории</h3>
              <div className="h-56 glass rounded-3xl p-4 flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-600 text-xs italic">Нет операций</p>}
              </div>
            </div>
          </div>
        )}

        {state.activeTab === 'history' && (
          <div className="space-y-2">
            {state.transactions.map(t => (
              <TransactionCard 
                key={t.id} 
                transaction={t} 
                onDelete={(id) => setState(s => ({ ...s, transactions: s.transactions.filter(x => x.id !== id) }))}
              />
            ))}
          </div>
        )}

        {state.activeTab === 'insights' && (
          <div className="glass p-8 rounded-[40px] text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles size={32} className={isAiLoading ? 'animate-pulse' : ''} />
            </div>
            <h3 className="text-xl font-bold">Ваш AI Аналитик</h3>
            <p className="text-sm text-slate-400 min-h-[80px]">
              {isAiLoading ? "Изучаю ваши чеки..." : aiInsight || "Нажмите кнопку, чтобы получить персональный разбор финансов."}
            </p>
            <button 
              onClick={handleFetchInsights} 
              disabled={isAiLoading}
              className="w-full bg-indigo-600 py-4 rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-50"
            >
              Сгенерировать совет
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 glass rounded-[30px] flex items-center justify-around px-4 shadow-2xl z-50">
        <button onClick={() => { triggerHaptic(); setState(s => ({ ...s, activeTab: 'dashboard' })) }} className={`flex flex-col items-center gap-1 ${state.activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-600'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[9px] uppercase font-bold tracking-widest">Обзор</span>
        </button>
        <button onClick={() => { triggerHaptic(); setState(s => ({ ...s, activeTab: 'history' })) }} className={`flex flex-col items-center gap-1 ${state.activeTab === 'history' ? 'text-indigo-400' : 'text-slate-600'}`}>
          <History size={20} />
          <span className="text-[9px] uppercase font-bold tracking-widest">История</span>
        </button>
        <button onClick={() => { triggerHaptic(); setState(s => ({ ...s, activeTab: 'insights' })) }} className={`flex flex-col items-center gap-1 ${state.activeTab === 'insights' ? 'text-indigo-400' : 'text-slate-600'}`}>
          <Sparkles size={20} />
          <span className="text-[9px] uppercase font-bold tracking-widest">AI</span>
        </button>
      </nav>

      {state.isAdding && (
        <AddTransactionModal 
          onClose={() => setState(s => ({ ...s, isAdding: false }))}
          onAdd={(t) => setState(s => ({ ...s, transactions: [t, ...s.transactions], isAdding: false }))}
          customCategories={state.customCategories}
          onAddCategory={(type, cat) => setState(s => ({
            ...s,
            customCategories: {
              ...s.customCategories,
              [type === TransactionType.EXPENSE ? 'expense' : 'income']: [...s.customCategories[type === TransactionType.EXPENSE ? 'expense' : 'income'], cat]
            }
          }))}
        />
      )}
    </div>
  );
};

export default App;
