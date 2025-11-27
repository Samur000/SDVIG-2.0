import React, { useState } from 'react';
import { Habit, HabitFrequency, DayOfWeek } from '../../types';
import { v4 as uuid } from 'uuid';
import './Forms.css';

interface HabitFormProps {
  habit: Habit | null;
  onSave: (habit: Habit) => void;
  onCancel: () => void;
}

type FrequencyType = 'daily' | 'weekdays' | 'specific' | 'weekly';

const ALL_DAYS: DayOfWeek[] = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function HabitForm({ habit, onSave, onCancel }: HabitFormProps) {
  const getInitialFreqType = (): FrequencyType => {
    if (!habit) return 'daily';
    return habit.frequency.type;
  };
  
  const getInitialDays = (): DayOfWeek[] => {
    if (!habit) return ALL_DAYS;
    if (habit.frequency.type === 'specific') return habit.frequency.days;
    return ALL_DAYS;
  };
  
  const getInitialWeeklyTimes = (): number => {
    if (!habit) return 3;
    if (habit.frequency.type === 'weekly') return habit.frequency.times;
    return 3;
  };
  
  const [title, setTitle] = useState(habit?.title || '');
  const [freqType, setFreqType] = useState<FrequencyType>(getInitialFreqType());
  const [specificDays, setSpecificDays] = useState<DayOfWeek[]>(getInitialDays());
  const [weeklyTimes, setWeeklyTimes] = useState(getInitialWeeklyTimes());
  const [minAmount, setMinAmount] = useState(habit?.minAmount || '');
  const [time, setTime] = useState(habit?.time || '');
  
  const handleToggleDay = (day: DayOfWeek) => {
    if (specificDays.includes(day)) {
      setSpecificDays(specificDays.filter(d => d !== day));
    } else {
      setSpecificDays([...specificDays, day]);
    }
  };
  
  const buildFrequency = (): HabitFrequency => {
    switch (freqType) {
      case 'daily':
        return { type: 'daily' };
      case 'weekdays':
        return { type: 'weekdays' };
      case 'specific':
        return { type: 'specific', days: specificDays };
      case 'weekly':
        return { type: 'weekly', times: weeklyTimes };
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (freqType === 'specific' && specificDays.length === 0) return;
    
    onSave({
      id: habit?.id || uuid(),
      title: title.trim(),
      frequency: buildFrequency(),
      minAmount: minAmount.trim() || undefined,
      time: time || undefined,
      completedDates: habit?.completedDates || []
    });
  };
  
  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Название</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Например: Зарядка"
          required
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Частота</label>
        <select value={freqType} onChange={e => setFreqType(e.target.value as FrequencyType)}>
          <option value="daily">Каждый день</option>
          <option value="weekdays">По будням</option>
          <option value="specific">По конкретным дням</option>
          <option value="weekly">N раз в неделю</option>
        </select>
      </div>
      
      {freqType === 'specific' && (
        <div className="form-group">
          <label className="form-label">Дни недели</label>
          <div className="days-selector">
            {ALL_DAYS.map(day => (
              <button
                key={day}
                type="button"
                className={`day-btn ${specificDays.includes(day) ? 'active' : ''}`}
                onClick={() => handleToggleDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {freqType === 'weekly' && (
        <div className="form-group">
          <label className="form-label">Раз в неделю</label>
          <input
            type="number"
            value={weeklyTimes}
            onChange={e => setWeeklyTimes(parseInt(e.target.value) || 1)}
            min="1"
            max="7"
          />
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">Минимальный объём (опционально)</label>
        <input
          type="text"
          value={minAmount}
          onChange={e => setMinAmount(e.target.value)}
          placeholder="Например: 10 минут, 5 страниц"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Время (опционально)</label>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button 
          type="submit" 
          className="btn btn-primary filled"
          disabled={!title.trim() || (freqType === 'specific' && specificDays.length === 0)}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

