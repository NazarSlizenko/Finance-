
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

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  onClose, onAdd, customCategories, onAddCategory 
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
    const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
    const newCat: Category = {
      name: newCatName.trim(),
      iconName: 'Tag', // Ставим дефолтную иконку по имени
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    onAddCategory(type, newCat);
    setCategory(newCat.name);
    setIsCreatingCategory(false);
    setNewCatName('');
  };

  if (isCreatingCategory) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col p-6 animate-in fade-in">
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => setIsCreatingCategory(false)}><X size={24} className="text-slate-400" /></button>
          <h2 className="text-xl font-bold">Новая категория</h2>
          <div className="w-6"></div>
        </div>
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20"><Tag size={32} /></div>
          <input 
            className="w-full bg-slate-800 border-none rounded-2xl p-5 text-center text-xl outline-none focus:ring-2 ring-indigo-500"
            placeholder="Название..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            autoFocus
          />
          <button onClick={handleCreateCategory} className="w-full bg-indigo-600 py-4 rounded-2xl font-bold">Создать</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col animate-in slide-in-from-bottom">
      <div className="p-6 flex items-center justify-between">
        <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
        <h2 className="text-xl font-bold">Запись</h2>
        <div className="w-6"></div>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 space-y-8 no-scrollbar pb-20">
        <div className="flex p-1 bg-slate-800 rounded-xl">
          <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-3 rounded-lg text-sm ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>Расход</button>
          <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-3 rounded-lg text-sm ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>Доход</button>
        </div>
        <div className="text-center">
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-transparent text-5xl font-bold text-center outline-none" placeholder="0.00" autoFocus />
          <p className="text-slate-500 mt-2">BYN</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {currentCategories.map(cat => {
            const Icon = ICON_MAP[cat.iconName] || Tag;
            return (
              <button key={cat.name} type="button" onClick={() => setCategory(cat.name)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${category === cat.name ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
                <div style={{ color: cat.color }}><Icon size={18} /></div>
                <span className="text-[10px] truncate w-full text-center">{cat.name}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setIsCreatingCategory(true)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 text-slate-500"><Plus size={18} /><span className="text-[10px]">Своя</span></button>
        </div>
        <input className="w-full bg-slate-800/50 p-4 rounded-xl outline-none" placeholder="Описание (необязательно)" value={description} onChange={e => setDescription(e.target.value)} />
      </form>
      <div className="p-6"><button onClick={handleSubmit} className="w-full bg-indigo-600 py-4 rounded-2xl font-bold shadow-xl">Сохранить</button></div>
    </div>
  );
};

export default AddTransactionModal;
