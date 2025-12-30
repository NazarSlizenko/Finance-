
import React from 'react';
import { 
  ShoppingBag, 
  Coffee, 
  Home, 
  Car, 
  Utensils, 
  Smartphone, 
  Zap, 
  PlusCircle, 
  TrendingUp, 
  History, 
  Sparkles,
  Briefcase,
  Gift
} from 'lucide-react';
import { Transaction, TransactionType } from './types';

export const CATEGORIES = {
  EXPENSE: [
    { name: 'Продукты', icon: <ShoppingBag size={18} />, color: '#ef4444' },
    { name: 'Транспорт', icon: <Car size={18} />, color: '#f59e0b' },
    { name: 'Жилье', icon: <Home size={18} />, color: '#6366f1' },
    { name: 'Развлечения', icon: <Coffee size={18} />, color: '#ec4899' },
    { name: 'Еда вне дома', icon: <Utensils size={18} />, color: '#8b5cf6' },
    { name: 'Связь', icon: <Smartphone size={18} />, color: '#10b981' },
    { name: 'Коммуналка', icon: <Zap size={18} />, color: '#06b6d4' },
  ],
  INCOME: [
    { name: 'Зарплата', icon: <Briefcase size={18} />, color: '#22c55e' },
    { name: 'Бонус', icon: <TrendingUp size={18} />, color: '#3b82f6' },
    { name: 'Подарок', icon: <Gift size={18} />, color: '#fbbf24' },
  ]
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    category: 'Зарплата',
    description: 'Основная выплата',
    type: TransactionType.INCOME,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '2',
    amount: 120.50,
    category: 'Продукты',
    description: 'Евроопт',
    type: TransactionType.EXPENSE,
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    amount: 45.00,
    category: 'Транспорт',
    description: 'Яндекс Такси',
    type: TransactionType.EXPENSE,
    date: new Date().toISOString(),
  }
];

export const TABS = [
  { id: 'dashboard', label: 'Обзор', icon: <TrendingUp size={20} /> },
  { id: 'history', label: 'История', icon: <History size={20} /> },
  { id: 'insights', label: 'AI Советы', icon: <Sparkles size={20} /> },
];
