
import React from 'react';
import { 
  ShoppingBag, Car, Home, Coffee, Utensils, Smartphone, Zap, 
  Briefcase, TrendingUp, Gift, Tag, History, Sparkles, PlusCircle
} from 'lucide-react';
import { Transaction, TransactionType } from './types';

export const ICON_MAP: Record<string, any> = {
  ShoppingBag, Car, Home, Coffee, Utensils, Smartphone, Zap, 
  Briefcase, TrendingUp, Gift, Tag, History, Sparkles, PlusCircle
};

export const CATEGORIES = {
  EXPENSE: [
    { name: 'Продукты', iconName: 'ShoppingBag', color: '#ef4444' },
    { name: 'Транспорт', iconName: 'Car', color: '#f59e0b' },
    { name: 'Жилье', iconName: 'Home', color: '#6366f1' },
    { name: 'Развлечения', iconName: 'Coffee', color: '#ec4899' },
    { name: 'Еда вне дома', iconName: 'Utensils', color: '#8b5cf6' },
    { name: 'Связь', iconName: 'Smartphone', color: '#10b981' },
    { name: 'Коммуналка', iconName: 'Zap', color: '#06b6d4' },
  ],
  INCOME: [
    { name: 'Зарплата', iconName: 'Briefcase', color: '#22c55e' },
    { name: 'Бонус', iconName: 'TrendingUp', color: '#3b82f6' },
    { name: 'Подарок', iconName: 'Gift', color: '#fbbf24' },
  ]
};

// Default transactions for a new user
export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    category: 'Зарплата',
    description: 'Ежемесячная выплата',
    type: TransactionType.INCOME,
    date: new Date().toISOString(),
  },
  {
    id: '2',
    amount: 120,
    category: 'Продукты',
    description: 'Закупка на неделю',
    type: TransactionType.EXPENSE,
    date: new Date().toISOString(),
  }
];

export const TABS = [
  { id: 'dashboard', label: 'Обзор', iconName: 'TrendingUp' },
  { id: 'history', label: 'История', iconName: 'History' },
  { id: 'insights', label: 'AI Советы', iconName: 'Sparkles' },
];
