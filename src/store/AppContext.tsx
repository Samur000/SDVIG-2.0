import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
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
import { loadState, saveState } from './storage';

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

  // Загрузка при старте
  useEffect(() => {
    const loaded = loadState();
    // Обеспечиваем совместимость со старыми данными
    const withSettings = {
      ...loaded,
      settings: loaded.settings || initialState.settings
    };
    dispatch({ type: 'LOAD_STATE', payload: withSettings });
    setIsLoaded(true);
  }, []);

  // Сохранение при изменениях
  useEffect(() => {
    if (isLoaded) {
      saveState(state);
    }
  }, [state, isLoaded]);

  // Применение темы
  useEffect(() => {
    const theme = state.settings?.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [state.settings?.theme]);

  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        Загрузка...
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

