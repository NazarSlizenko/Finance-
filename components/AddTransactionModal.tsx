
import React, { useState, useMemo } from 'react';
import { X, Check, Plus, Tag } from 'lucide-react';
import { TransactionType, Transaction, Category } from '../types';
import { CATEGORIES } from '../constants';

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
  customCategories: { expense: Category[], income: Category[] };
  onAddCategory: (type: TransactionType, category: Category) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  onClose, 
  onAdd, 
  customCategories, 
  onAddCategory 
}) => {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.EXPENSE[0].name);
  const [description, setDescription] = useState('');

  const currentCategories = useMemo(() => {
    const defaults = type === TransactionType.EXPENSE ? CATEGORIES.EXPENSE : CATEGORIES.INCOME;
    const customs = type === TransactionType.EXPENSE ? customCategories.expense : customCategories.income;
    return [...defaults, ...customs];
  }, [type, customCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      amount: parseFloat(amount),
      category,
      description,
      type,
      date: new Date().toISOString(),
    };

    onAdd(newTransaction);
    onClose();
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    
    // Simple color selection based on name length or random
    const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCat: Category = {
      name: newCatName.trim(),
      icon: <Tag size={18} />,
      color: randomColor
    };
    
    onAddCategory(type, newCat);
    setCategory(newCat.name);
    setNewCatName('');
    setIsCreatingCategory(false);
  };

  if (isCreatingCategory) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900 animate-in fade-in duration-200">
        <div className="p-6 flex items-center justify-between">
          <button onClick={() => setIsCreatingCategory(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold">Новая категория</h2>
          <div className="w-10"></div>
        </div>
        
        <div className="p-6 space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <Tag size={32} />
            </div>
            <p className="text-slate-400 text-sm">Придумайте название для своей категории</p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Напр. Подписки, Здоровье..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 focus:border-indigo-500 outline-none text-lg text-center"
              autoFocus
            />
          </div>

          <button
            onClick={handleCreateCategory}
            disabled={!newCatName.trim()}
            className="w-full bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all"
          >
            <Check size={20} />
            Создать категорию
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 animate-in slide-in-from-bottom duration-300">
      <div className="p-6 flex items-center justify-between">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold">Новая запись</h2>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 no-scrollbar">
        {/* Type Toggle */}
        <div className="flex p-1 bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setType(TransactionType.EXPENSE); setCategory(CATEGORIES.EXPENSE[0].name); }}
            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}
          >
            Расход
          </button>
          <button
            type="button"
            onClick={() => { setType(TransactionType.INCOME); setCategory(CATEGORIES.INCOME[0].name); }}
            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
          >
            Доход
          </button>
        </div>

        {/* Amount Input */}
        <div className="text-center py-4">
          <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Сумма (Br)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-5xl font-bold text-center outline-none focus:text-white transition-colors"
            autoFocus
          />
        </div>

        {/* Categories Grid */}
        <div className="space-y-3">
          <label className="text-xs text-slate-500 uppercase tracking-widest">Категория</label>
          <div className="grid grid-cols-4 gap-3">
            {currentCategories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setCategory(cat.name)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all border ${
                  category === cat.name 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div style={{ color: cat.color }}>{cat.icon}</div>
                <span className="text-[10px] text-center font-medium text-slate-300 truncate w-full">{cat.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCreatingCategory(true)}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all border border-dashed border-slate-700 bg-slate-800/20 hover:bg-slate-800/40 text-slate-500"
            >
              <Plus size={18} />
              <span className="text-[10px] text-center font-medium">Своя</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="text-xs text-slate-500 uppercase tracking-widest">Описание</label>
          <input
            type="text"
            placeholder="На что потратили?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-4 focus:border-indigo-500 outline-none"
          />
        </div>
      </form>

      {/* Persistent CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all"
        >
          <Check size={20} />
          Добавить {type === TransactionType.EXPENSE ? 'расход' : 'доход'}
        </button>
      </div>
    </div>
  );
};

export default AddTransactionModal;
