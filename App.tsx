
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { Transaction, TransactionType, AppState, Category } from './types';
import { INITIAL_TRANSACTIONS, TABS, CATEGORIES } from './constants';
import TransactionCard from './components/TransactionCard';
import AddTransactionModal from './components/AddTransactionModal';
import { getFinancialInsights } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('byn_finance_state_v2');
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
    localStorage.setItem('byn_finance_state_v2', JSON.stringify(state));
  }, [state]);

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
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('ru-BY', { day: 'numeric', month: 'short' });
      const dayExpense = state.transactions
        .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).toDateString() === date.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: dateStr, value: dayExpense };
    });
    return last7Days;
  }, [state.transactions]);

  const allExpenseCategories = useMemo(() => 
    [...CATEGORIES.EXPENSE, ...state.customCategories.expense], 
  [state.customCategories.expense]);

  const allIncomeCategories = useMemo(() => 
    [...CATEGORIES.INCOME, ...state.customCategories.income], 
  [state.customCategories.income]);

  const pieData = useMemo(() => {
    const categories: Record<string, number> = {};
    state.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categories).map(([name, value]) => {
      const cat = allExpenseCategories.find(c => c.name === name);
      return { name, value, color: cat?.color || '#94a3b8' };
    });
  }, [state.transactions, allExpenseCategories]);

  const handleAddTransaction = (newT: Transaction) => {
    setState(prev => ({
      ...prev,
      transactions: [newT, ...prev.transactions]
    }));
  };

  const handleAddCustomCategory = (type: TransactionType, category: Category) => {
    setState(prev => ({
      ...prev,
      customCategories: {
        ...prev.customCategories,
        [type === TransactionType.EXPENSE ? 'expense' : 'income']: [
          ...prev.customCategories[type === TransactionType.EXPENSE ? 'expense' : 'income'],
          category
        ]
      }
    }));
  };

  const fetchInsights = async () => {
    setIsAiLoading(true);
    const insight = await getFinancialInsights(state.transactions);
    setAiInsight(insight);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen pb-28 relative">
      {/* Header / Summary */}
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
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Доход</p>
              <p className="font-bold text-emerald-400">+{stats.income.toLocaleString('ru-BY')} Br</p>
            </div>
          </div>
          <div className="glass-effect p-4 rounded-3xl flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <ArrowDownRight size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Расход</p>
              <p className="font-bold text-rose-400">-{stats.expense.toLocaleString('ru-BY')} Br</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="p-6">
        {state.activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-200">Траты за неделю</h3>
              </div>
              <div className="h-48 w-full bg-slate-800/20 rounded-3xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                      contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff'}}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 6 ? '#6366f1' : '#334155'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-200">Категории</h3>
              </div>
              <div className="h-56 w-full flex items-center justify-center bg-slate-800/20 rounded-3xl p-4 border border-white/5">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff'}}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-sm">Нет данных для анализа</p>
                )}
              </div>
            </section>
          </div>
        )}

        {state.activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="font-bold text-lg text-slate-200 mb-4">История операций</h3>
            <div className="space-y-1">
              {state.transactions.length > 0 ? (
                state.transactions.map(t => (
                  <TransactionCard key={t.id} transaction={t} />
                ))
              ) : (
                <div className="py-20 text-center">
                  <p className="text-slate-500">Пока пусто...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {state.activeTab === 'insights' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="glass-effect p-8 rounded-[40px] text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full"></div>
              
              <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <RefreshCw 
                  size={32} 
                  className={`text-indigo-400 ${isAiLoading ? 'animate-spin' : ''}`} 
                  onClick={fetchInsights}
                />
              </div>

              <h3 className="text-2xl font-bold">Интеллектуальный анализ</h3>
              
              <div className="min-h-[100px] flex items-center justify-center italic text-slate-300">
                {isAiLoading ? (
                  <div className="space-y-3 w-full">
                    <div className="h-4 bg-white/5 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-white/5 rounded-full w-4/5 animate-pulse mx-auto"></div>
                    <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse mx-auto"></div>
                  </div>
                ) : (
                  <p className="text-lg leading-relaxed">
                    {aiInsight || "Нажмите на иконку выше, чтобы Gemini проанализировал ваши финансы и дал персональные рекомендации ✨"}
                  </p>
                )}
              </div>

              {!aiInsight && !isAiLoading && (
                <button
                  onClick={fetchInsights}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all shadow-lg shadow-indigo-900/40"
                >
                  Получить рекомендации
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 glass-effect rounded-[30px] flex items-center justify-around px-4 border border-white/10 z-40 shadow-2xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${state.activeTab === tab.id ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            {state.activeTab === tab.id && (
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1 animate-in fade-in duration-300"></div>
            )}
          </button>
        ))}
      </nav>

      {/* Modal */}
      {state.isAdding && (
        <AddTransactionModal 
          onClose={() => setState(prev => ({ ...prev, isAdding: false }))} 
          onAdd={handleAddTransaction}
          customCategories={state.customCategories}
          onAddCategory={handleAddCustomCategory}
        />
      )}
    </div>
  );
};

export default App;
