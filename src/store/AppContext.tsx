/**
 * Главный контекст приложения СДВиГ
 * 
 * ВАЖНО: С версии 2.0 данные хранятся в IndexedDB
 * При первом запуске выполняется автоматическая миграция из localStorage
 */

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { 
  AppState, 
  initialState, 
  Routine, 
  Event, 
  DayTask,
  Wallet, 
  Transaction, 
  Task, 
  Habit, 
  Idea, 
  Profile, 
  Document,
  FocusSession,
  Theme
} from '../types';
import { initStorage, saveStateAsync } from './storage';

// Action Types
type Action =
  // Рутины
  | { type: 'ADD_ROUTINE'; payload: Routine }
  | { type: 'UPDATE_ROUTINE'; payload: Routine }
  | { type: 'DELETE_ROUTINE'; payload: string }
  | { type: 'TOGGLE_ROUTINE'; payload: { id: string; date: string } }
  // События
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'TOGGLE_EVENT'; payload: string }
  | { type: 'MOVE_EVENT_TO_TOMORROW'; payload: string }
  // Задачи дня
  | { type: 'SET_DAY_TASKS'; payload: { date: string; tasks: DayTask[] } }
  | { type: 'TOGGLE_DAY_TASK'; payload: { date: string; taskId: string } }
  | { type: 'UPDATE_DAY_TASK'; payload: { date: string; task: DayTask } }
  | { type: 'DELETE_DAY_TASK'; payload: { date: string; taskId: string } }
  // Финансы
  | { type: 'ADD_WALLET'; payload: Wallet }
  | { type: 'UPDATE_WALLET'; payload: Wallet }
  | { type: 'DELETE_WALLET'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: string }
  // Задачи To-Do
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: string }
  // Привычки
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_HABIT'; payload: { id: string; date: string } }
  // Инбокс
  | { type: 'ADD_IDEA'; payload: Idea }
  | { type: 'UPDATE_IDEA'; payload: Idea }
  | { type: 'DELETE_IDEA'; payload: string }
  // Профиль
  | { type: 'UPDATE_PROFILE'; payload: Profile }
  // Документы
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  // Фокус
  | { type: 'ADD_FOCUS_SESSION'; payload: FocusSession }
  // Настройки
  | { type: 'SET_THEME'; payload: Theme }
  // Общее
  | { type: 'LOAD_STATE'; payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // Рутины
    case 'ADD_ROUTINE':
      return { ...state, routines: [...state.routines, action.payload] };
    case 'UPDATE_ROUTINE':
      return {
        ...state,
        routines: state.routines.map(r => r.id === action.payload.id ? action.payload : r)
      };
    case 'DELETE_ROUTINE':
      return { ...state, routines: state.routines.filter(r => r.id !== action.payload) };
    case 'TOGGLE_ROUTINE':
      return {
        ...state,
        routines: state.routines.map(r => {
          if (r.id === action.payload.id) {
            const newCompleted = { ...r.completed };
            newCompleted[action.payload.date] = !newCompleted[action.payload.date];
            return { ...r, completed: newCompleted };
          }
          return r;
        })
      };

    // События
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e)
      };
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.payload) };
    case 'TOGGLE_EVENT':
      return {
        ...state,
        events: state.events.map(e => 
          e.id === action.payload ? { ...e, completed: !e.completed } : e
        )
      };
    case 'MOVE_EVENT_TO_TOMORROW': {
      const event = state.events.find(e => e.id === action.payload);
      if (!event) return state;
      const currentDate = new Date(event.date);
      currentDate.setDate(currentDate.getDate() + 1);
      const newDate = currentDate.toISOString().split('T')[0];
      return {
        ...state,
        events: state.events.map(e => 
          e.id === action.payload ? { ...e, date: newDate } : e
        )
      };
    }

    // Задачи дня
    case 'SET_DAY_TASKS':
      return {
        ...state,
        dayTasks: { ...state.dayTasks, [action.payload.date]: action.payload.tasks }
      };
    case 'TOGGLE_DAY_TASK':
      return {
        ...state,
        dayTasks: {
          ...state.dayTasks,
          [action.payload.date]: (state.dayTasks[action.payload.date] || []).map(t =>
            t.id === action.payload.taskId ? { ...t, completed: !t.completed } : t
          )
        }
      };
    case 'UPDATE_DAY_TASK':
      return {
        ...state,
        dayTasks: {
          ...state.dayTasks,
          [action.payload.date]: (state.dayTasks[action.payload.date] || []).map(t =>
            t.id === action.payload.task.id ? action.payload.task : t
          )
        }
      };
    case 'DELETE_DAY_TASK':
      return {
        ...state,
        dayTasks: {
          ...state.dayTasks,
          [action.payload.date]: (state.dayTasks[action.payload.date] || []).filter(t =>
            t.id !== action.payload.taskId
          )
        }
      };

    // Финансы
    case 'ADD_WALLET':
      return { ...state, wallets: [...state.wallets, action.payload] };
    case 'UPDATE_WALLET':
      return {
        ...state,
        wallets: state.wallets.map(w => w.id === action.payload.id ? action.payload : w)
      };
    case 'DELETE_WALLET':
      return { 
        ...state, 
        wallets: state.wallets.filter(w => w.id !== action.payload),
        transactions: state.transactions.filter(t => t.walletId !== action.payload)
      };
    case 'ADD_TRANSACTION': {
      const wallet = state.wallets.find(w => w.id === action.payload.walletId);
      if (!wallet) return state;
      const balanceChange = action.payload.type === 'income' 
        ? action.payload.amount 
        : -action.payload.amount;
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
        wallets: state.wallets.map(w => 
          w.id === action.payload.walletId 
            ? { ...w, balance: w.balance + balanceChange }
            : w
        )
      };
    }
    case 'DELETE_TRANSACTION': {
      const tx = state.transactions.find(t => t.id === action.payload);
      if (!tx) return state;
      const balanceRevert = tx.type === 'income' ? -tx.amount : tx.amount;
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        wallets: state.wallets.map(w =>
          w.id === tx.walletId
            ? { ...w, balance: w.balance + balanceRevert }
            : w
        )
      };
    }
    case 'ADD_CATEGORY':
      if (state.categories.includes(action.payload)) return state;
      return { ...state, categories: [...state.categories, action.payload] };

    // Задачи To-Do
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'DELETE_TASK':
      return { 
        ...state, 
        tasks: state.tasks.filter(t => t.id !== action.payload && t.parentId !== action.payload) 
      };
    case 'TOGGLE_TASK': {
      const now = new Date().toISOString();
      
      // Сначала переключаем задачу с записью времени выполнения
      let newTasks = state.tasks.map(t => {
        if (t.id === action.payload) {
          const willBeCompleted = !t.completed;
          return { 
            ...t, 
            completed: willBeCompleted,
            completedAt: willBeCompleted ? now : undefined
          };
        }
        return t;
      });
      
      // Находим задачу которую переключили
      const toggledTask = newTasks.find(t => t.id === action.payload);
      
      // Если это подзадача, проверяем не выполнены ли все подзадачи родителя
      if (toggledTask?.parentId) {
        const siblingSubtasks = newTasks.filter(t => t.parentId === toggledTask.parentId);
        const allSubtasksCompleted = siblingSubtasks.every(t => t.completed);
        
        // Если все подзадачи выполнены - отмечаем родительскую задачу выполненной
        if (allSubtasksCompleted) {
          newTasks = newTasks.map(t =>
            t.id === toggledTask.parentId ? { ...t, completed: true, completedAt: now } : t
          );
        }
      }
      
      return { ...state, tasks: newTasks };
    }

    // Привычки
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h)
      };
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };
    case 'TOGGLE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id === action.payload.id) {
            const dates = h.completedDates.includes(action.payload.date)
              ? h.completedDates.filter(d => d !== action.payload.date)
              : [...h.completedDates, action.payload.date];
            return { ...h, completedDates: dates };
          }
          return h;
        })
      };

    // Инбокс
    case 'ADD_IDEA':
      return { ...state, ideas: [...state.ideas, action.payload] };
    case 'UPDATE_IDEA':
      return {
        ...state,
        ideas: state.ideas.map(i => i.id === action.payload.id ? action.payload : i)
      };
    case 'DELETE_IDEA':
      return { ...state, ideas: state.ideas.filter(i => i.id !== action.payload) };

    // Профиль
    case 'UPDATE_PROFILE':
      return { ...state, profile: action.payload };

    // Документы
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'DELETE_DOCUMENT':
      return { ...state, documents: state.documents.filter(d => d.id !== action.payload) };

    // Фокус
    case 'ADD_FOCUS_SESSION':
      return { ...state, focusSessions: [...state.focusSessions, action.payload] };

    // Настройки
    case 'SET_THEME':
      return { ...state, settings: { ...state.settings, theme: action.payload } };

    // Общее
    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  
  // Ref для отслеживания, нужно ли сохранять
  const isInitialMount = useRef(true);
  // Ref для debounce сохранения
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============ Загрузка данных при старте (из IndexedDB) ============
  useEffect(() => {
    async function loadData() {
      try {
        console.log('AppContext: инициализация хранилища...');
        
        // initStorage выполняет:
        // 1. Открытие IndexedDB
        // 2. Миграцию из localStorage (если нужно)
        // 3. Загрузку данных
        const loadedState = await initStorage();
        
        // Обеспечиваем совместимость со старыми данными
        const withDefaults: AppState = {
          ...loadedState,
          settings: loadedState.settings || initialState.settings
        };
        
        dispatch({ type: 'LOAD_STATE', payload: withDefaults });
        setIsLoaded(true);
        
        console.log('AppContext: данные успешно загружены');
      } catch (error) {
        console.error('AppContext: ошибка загрузки данных:', error);
        setLoadError('Ошибка загрузки данных. Попробуйте обновить страницу.');
        // Даже при ошибке показываем приложение с начальным состоянием
        setIsLoaded(true);
      }
    }
    
    loadData();
  }, []);

  // ============ Сохранение данных при изменениях (в IndexedDB) ============
  useEffect(() => {
    // Пропускаем первый рендер и рендер до загрузки
    if (isInitialMount.current || !isLoaded) {
      isInitialMount.current = false;
      return;
    }

    // Debounce сохранения для избежания частых записей
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveStateAsync(state);
        // Сохранение успешно - не логируем каждый раз
      } catch (error) {
        console.error('AppContext: ошибка сохранения:', error);
      }
    }, 300); // 300ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isLoaded]);

  // ============ Применение темы ============
  useEffect(() => {
    const theme = state.settings?.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [state.settings?.theme]);

  // ============ Экран загрузки ============
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #E5E7EB',
          borderTopColor: '#0F766E',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ color: '#6B7280' }}>Загрузка...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ============ Экран ошибки ============
  if (loadError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '48px',
          marginBottom: '16px'
        }}>⚠️</div>
        <p style={{ 
          color: '#DC2626',
          marginBottom: '16px'
        }}>{loadError}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#0F766E',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
