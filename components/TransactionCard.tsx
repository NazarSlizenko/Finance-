
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES, ICON_MAP } from '../constants';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onDelete }) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const allCats = [...CATEGORIES.EXPENSE, ...CATEGORIES.INCOME];
  const catInfo = allCats.find(c => c.name === transaction.category) || { iconName: 'Tag', color: '#94a3b8' };
  const Icon = ICON_MAP[catInfo.iconName] || ICON_MAP['Tag'];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tg = window.Telegram?.WebApp;
    
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('warning');
    }

    if (onDelete) {
      if (tg?.showConfirm) {
        tg.showConfirm('Удалить эту операцию?', (confirmed: boolean) => {
          if (confirmed) onDelete(transaction.id);
        });
      } else {
        if (confirm('Удалить эту операцию?')) {
          onDelete(transaction.id);
        }
      }
    }
  };

  const handlePress = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <div 
      onClick={handlePress}
      className="group glass-effect p-4 rounded-2xl flex items-center justify-between mb-3 border border-white/5 active:scale-[0.98] transition-all relative overflow-hidden"
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" 
          style={{ backgroundColor: `${catInfo.color}20`, color: catInfo.color }}
        >
          <Icon size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">{transaction.category}</h3>
          <p className="text-sm text-slate-400 truncate max-w-[120px]">
            {transaction.description || 'Без описания'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={`font-bold text-lg ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isIncome ? '+' : '-'}{transaction.amount.toLocaleString('ru-BY')} Br
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
            {new Date(transaction.date).toLocaleDateString('ru-BY', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        
        {onDelete && (
          <button 
            onClick={handleDelete}
            className="p-2 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Удалить"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionCard;
