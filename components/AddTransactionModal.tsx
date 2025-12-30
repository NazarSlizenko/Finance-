
import React, { useState, useMemo } from 'react';
import { X, Check, Plus, Tag } from 'lucide-react';
import { TransactionType, Transaction, Category } from '../types';
import { CATEGORIES, ICON_MAP } from '../constants';

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
  customCategories: { expense: Category[], income: Category[] };
  onAddCategory: (type: TransactionType, category: Category) => void;
}

const AVAILABLE_ICONS = ['ShoppingBag', 'Car', 'Home', 'Coffee', 'Utensils', 'Smartphone', 'Zap', 'Briefcase', 'TrendingUp', 'Gift', 'Tag', 'PlusCircle'];

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  onClose, onAdd, customCategories, onAddCategory 
}) => {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.EXPENSE[0].name);
  const [description, setDescription] = useState('');

  const currentCategories = useMemo(() => {
    const defaults = type === TransactionType.EXPENSE ? CATEGORIES.EXPENSE : CATEGORIES.INCOME;
    const customs = type === TransactionType.EXPENSE ? customCategories.expense : customCategories.income;
    return [...defaults, ...customs];
  }, [type, customCategories]);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    triggerHaptic('medium');
    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      amount: parseFloat(amount),
      category, description, type,
      date: new Date().toISOString(),
    });
    onClose();
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    
    triggerHaptic('heavy');
    const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
    const newCat: Category = {
      name: newCatName.trim(),
      iconName: newCatIcon,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    onAddCategory(type, newCat);
    setCategory(newCat.name);
    setIsCreatingCategory(false);
    setNewCatName('');
  };

  if (isCreatingCategory) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col p-6 animate-in fade-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => { triggerHaptic(); setIsCreatingCategory(false); }} className="p-2"><X size={24} className="text-slate-400" /></button>
          <h2 className="text-xl font-bold">Новая категория</h2>
          <div className="w-10"></div>
        </div>
        
        <div className="space-y-8 overflow-y-auto no-scrollbar pb-10">
          <div className="text-center">
            <div 
              className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20 mb-4 transition-all"
            >
              {React.createElement(ICON_MAP[newCatIcon] || Tag, { size: 32 })}
            </div>
            <input 
              className="w-full bg-slate-900 border-b border-indigo-500/30 rounded-none p-4 text-center text-2xl outline-none focus:border-indigo-500 transition-colors"
              placeholder="Назовите категорию"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest text-center">Выберите иконку</p>
            <div className="grid grid-cols-4 gap-4">
              {AVAILABLE_ICONS.map(iconName => {
                const IconComponent = ICON_MAP[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => { triggerHaptic(); setNewCatIcon(iconName); }}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${newCatIcon === iconName ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    <IconComponent size={24} />
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleCreateCategory} 
            disabled={!newCatName.trim()}
            className="w-full bg-indigo-600 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-900/20 disabled:opacity-50 transition-all active:scale-95"
          >
            Создать
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="p-6 flex items-center justify-between">
        <button onClick={() => { triggerHaptic(); onClose(); }} className="p-2"><X size={24} className="text-slate-400" /></button>
        <h2 className="text-xl font-bold">Новая запись</h2>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 space-y-8 no-scrollbar pb-32">
        <div className="flex p-1 bg-slate-900 rounded-2xl border border-white/5">
          <button 
            type="button" 
            onClick={() => { triggerHaptic(); setType(TransactionType.EXPENSE); }} 
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-slate-500'}`}
          >
            Расход
          </button>
          <button 
            type="button" 
            onClick={() => { triggerHaptic(); setType(TransactionType.INCOME); }} 
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500'}`}
          >
            Доход
          </button>
        </div>

        <div className="text-center py-4">
          <input 
            type="number" 
            step="0.01" 
            inputMode="decimal"
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            className="w-full bg-transparent text-6xl font-black text-center outline-none placeholder-slate-800" 
            placeholder="0.00" 
            autoFocus 
          />
          <p className="text-indigo-400 font-bold tracking-widest mt-2">БЕЛОРУССКИХ РУБЛЕЙ</p>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Категория</p>
          <div className="grid grid-cols-4 gap-3">
            {currentCategories.map(cat => {
              const Icon = ICON_MAP[cat.iconName] || Tag;
              return (
                <button 
                  key={cat.name} 
                  type="button" 
                  onClick={() => { triggerHaptic(); setCategory(cat.name); }} 
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${category === cat.name ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-slate-900/50'}`}
                >
                  <div style={{ color: cat.color }} className="transition-transform duration-300 transform group-active:scale-125">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] truncate w-full text-center font-medium">{cat.name}</span>
                </button>
              );
            })}
            <button 
              type="button" 
              onClick={() => { triggerHaptic(); setIsCreatingCategory(true); }} 
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 text-slate-500"
            >
              <Plus size={18} />
              <span className="text-[10px] font-medium">Своя</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Заметка</p>
          <input 
            className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500/50 transition-colors" 
            placeholder="На что ушли деньги?" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>
      </form>

      <div className="p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent fixed bottom-0 left-0 right-0">
        <button 
          onClick={handleSubmit} 
          className="w-full bg-indigo-600 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-900/40 active:scale-95 transition-all"
        >
          Готово
        </button>
      </div>
    </div>
  );
};

export default AddTransactionModal;
