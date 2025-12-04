import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { useApp } from '../../store/AppContext';
import { Theme, initialState, AppState } from '../../types';
import './ProfilePage.css';

type ConfirmType = 'export' | 'import' | null;

export function SettingsPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmType>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // Переключение темы
  const handleThemeChange = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };
  
  // Экспорт данных в JSON-файл
  const executeExport = useCallback(() => {
    try {
      // Собираем все данные из localStorage
      const backupData: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              backupData[key] = JSON.parse(value);
            } catch {
              backupData[key] = value;
            }
          }
        }
      }
      
      // Формируем имя файла с датой
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const filename = `sdvig-backup-${dateStr}.json`;
      
      // Создаём и скачиваем файл
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      setConfirmModal(null);
    } catch (error) {
      console.error('Ошибка при экспорте данных:', error);
      alert('Ошибка при экспорте данных');
    }
  }, []);
  
  // Импорт данных из JSON-файла
  const executeImport = useCallback(() => {
    if (!pendingFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);
        
        // Очищаем localStorage и записываем данные из бэкапа
        localStorage.clear();
        for (const [key, value] of Object.entries(backupData)) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
        
        // Загружаем состояние приложения
        const appStateKey = 'sdvig-app-state';
        const savedState = localStorage.getItem(appStateKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          const newState: AppState = { ...initialState, ...parsed };
          dispatch({ type: 'LOAD_STATE', payload: newState });
        }
        
        setConfirmModal(null);
        setPendingFile(null);
        alert('Данные успешно восстановлены!');
      } catch (error) {
        console.error('Ошибка при импорте данных:', error);
        alert('Ошибка при чтении файла. Убедитесь, что это корректный JSON-файл бэкапа.');
      }
    };
    
    reader.readAsText(pendingFile);
    
    // Сбрасываем значение input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [pendingFile, dispatch]);
  
  // Обработчик выбора файла
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setPendingFile(file);
    setConfirmModal('import');
  };
  
  // Отмена действия
  const handleCancel = () => {
    setConfirmModal(null);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Layout 
      title="Настройки"
      headerRight={
        <button 
          className="header-back-btn" 
          onClick={() => navigate('/profile')}
          title="Назад"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      }
    >
      {/* Оформление */}
      <div className="settings-section">
        <h3>Оформление</h3>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-title">Тема оформления</span>
              <span className="settings-item-desc">Выберите светлую или тёмную тему</span>
            </div>
            <div className="theme-toggle">
              <button 
                className={`theme-btn ${state.settings?.theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </button>
              <button 
                className={`theme-btn ${state.settings?.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Данные */}
      <div className="settings-section">
        <h3>Данные</h3>
        <div className="settings-list">
          <div className="settings-item backup-section">
            <div className="settings-item-info">
              <span className="settings-item-title">Бэкап данных</span>
              <span className="settings-item-desc">Экспорт и импорт данных приложения</span>
            </div>
            <div className="backup-actions">
              <button 
                className="btn btn-sm"
                onClick={() => setConfirmModal('export')}
              >
                Экспорт
              </button>
              <label className="btn btn-sm btn-primary">
                Импорт
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* О приложении */}
      <div className="settings-section">
        <h3>О приложении</h3>
        <div className="settings-list">
          <a 
            href="https://samur000.github.io/SDVIG-INFO//" 
            target="_blank" 
            rel="noopener noreferrer"
            className="settings-link"
          >
            <div className="settings-link-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <span>О проекте</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-link-arrow">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
          
          <a 
            href="https://t.me/qafurov" 
            target="_blank" 
            rel="noopener noreferrer"
            className="settings-link"
          >
            <div className="settings-link-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <span>Связаться с разработчиком</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-link-arrow">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>
      </div>
      
      {/* Версия */}
      <div className="settings-version">
        <span>СДВиГ v2.0</span>
      </div>
      
      {/* Модалка подтверждения экспорта */}
      <Modal
        isOpen={confirmModal === 'export'}
        onClose={handleCancel}
        title="Экспорт данных"
      >
        <div className="confirm-modal">
          <p className="confirm-text">
            Вы уверены, что хотите экспортировать все данные приложения?
          </p>
          <p className="confirm-hint">
            Будет скачан JSON-файл с резервной копией.
          </p>
          <div className="confirm-actions">
            <button className="btn" onClick={handleCancel}>
              Отмена
            </button>
            <button className="btn btn-primary filled" onClick={executeExport}>
              Да, экспортировать
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Модалка подтверждения импорта */}
      <Modal
        isOpen={confirmModal === 'import'}
        onClose={handleCancel}
        title="Импорт данных"
      >
        <div className="confirm-modal">
          <p className="confirm-text">
            Вы уверены, что хотите импортировать данные из файла?
          </p>
          <p className="confirm-hint confirm-warning">
            Внимание: все текущие данные будут заменены!
          </p>
          {pendingFile && (
            <p className="confirm-file">
              Файл: {pendingFile.name}
            </p>
          )}
          <div className="confirm-actions">
            <button className="btn" onClick={handleCancel}>
              Отмена
            </button>
            <button className="btn btn-primary filled" onClick={executeImport}>
              Да, импортировать
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
