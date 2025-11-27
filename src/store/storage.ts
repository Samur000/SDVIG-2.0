import { AppState, initialState } from '../types';

const STORAGE_KEY = 'sdvig-app-state';

export function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Мержим с initialState чтобы добавить новые поля при обновлении
      return { ...initialState, ...parsed };
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
  return initialState;
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
    return false;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Ошибка очистки данных:', error);
  }
}

