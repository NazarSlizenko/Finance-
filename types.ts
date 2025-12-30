
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Category {
  name: string;
  iconName: string; // Храним имя иконки, а не компонент
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

export interface AppState {
  transactions: Transaction[];
  customCategories: {
    expense: Category[];
    income: Category[];
  };
  activeTab: 'dashboard' | 'history' | 'insights';
  isAdding: boolean;
}
