
import React from 'react';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Category {
  name: string;
  icon: React.ReactNode;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
  date: string;
}

export interface CategorySummary {
  name: string;
  value: number;
  color: string;
}

export interface AppState {
  transactions: Transaction[];
  customCategories: {
    expense: Category[];
    income: Category[];
  };
  isAdding: boolean;
  activeTab: 'dashboard' | 'history' | 'insights';
}
