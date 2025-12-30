
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES } from '../constants';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  
  // Find category icon
  const allCats = [...CATEGORIES.EXPENSE, ...CATEGORIES.INCOME];
  const catInfo = allCats.find(c => c.name === transaction.category) || allCats[0];

  return (
    <div className="glass-effect p-4 rounded-2xl flex items-center justify-between mb-3 transform transition-all active:scale-95 border border-white/5">
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center" 
          style={{ backgroundColor: `${catInfo.color}20`, color: catInfo.color }}
        >
          {catInfo.icon}
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">{transaction.category}</h3>
          <p className="text-sm text-slate-400 truncate max-w-[140px]">{transaction.description || 'Нет описания'}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isIncome ? '+' : '-'}{transaction.amount.toLocaleString('ru-BY')} Br
        </p>
        <p className="text-xs text-slate-500">
          {new Date(transaction.date).toLocaleDateString('ru-BY', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
};

export default TransactionCard;
