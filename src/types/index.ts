export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
  COOK = 'COOK',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  department?: string;
  commune?: string;
  isVerified: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  quantity: number; // in kg or liters
  unit: 'kg' | 'L';
  lastUpdated: string;
}

export interface StockAltert {
  itemId: string;
  threshold: number;
  message: string;
}

export interface DailyReport {
  id: string;
  date: string;
  schoolId: string;
  studentsCount: number;
  mealName: string;
  ingredients: {
    itemId: string;
    quantity: number;
  }[];
  photoUrl?: string;
  submittedBy: string;
}

export interface BeninLocation {
  department: string;
  communes: string[];
}
