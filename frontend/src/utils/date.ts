import { format } from 'date-fns';

/**
 * Возвращает процент от 24-часового дня (0-100) для заданной даты.
 * Используется для позиционирования маркеров на шкале времени.
 */
export const minutesToPercent = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return (minutes / 1440) * 100;
};

/**
 * Форматирует время в формате HH:mm.
 */
export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

/**
 * Форматирует дедлайн для карточки квеста.
 * Если дата null, возвращает null.
 */
export const formatDeadline = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
