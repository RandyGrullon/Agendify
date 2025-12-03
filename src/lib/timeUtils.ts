import { format, parse } from 'date-fns';

/**
 * Centralized time utility functions
 * Consolidates time formatting logic from AgendaForm, AgendaTable
 */

/**
 * Format time string to 12-hour format with AM/PM
 */
export const formatTime = (timeStr: string | undefined | null): string => {
  if (!timeStr) return '';

  try {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return format(date, 'h:mm a');
  } catch (error) {
    return timeStr;
  }
};

/**
 * Format time string to 24-hour format (HH:mm)
 */
export const formatTime24 = (timeStr: string | undefined | null): string => {
  if (!timeStr) return '';

  try {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    return timeStr;
  }
};

/**
 * Parse 12-hour time format to 24-hour format
 */
export const parseTime12to24 = (time12: string): string => {
  try {
    const date = parse(time12, 'h:mm a', new Date());
    return format(date, 'HH:mm');
  } catch (error) {
    return '';
  }
};

/**
 * Calculate duration in minutes between two time strings
 */
export const calculateDuration = (
  startTime: string,
  endTime: string
): number => {
  try {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    let duration = endTotalMinutes - startTotalMinutes;

    // Handle overnight duration (e.g., 23:00 to 02:00)
    if (duration < 0) {
      duration += 24 * 60;
    }

    return duration;
  } catch (error) {
    return 0;
  }
};

/**
 * Add minutes to a time string
 */
export const addMinutesToTime = (
  timeStr: string,
  minutes: number
): string => {
  try {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    return timeStr;
  }
};

/**
 * Format duration in minutes to human-readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  
  return `${hours}h ${mins}min`;
};

/**
 * Check if time string is valid (HH:mm format)
 */
export const isValidTime = (timeStr: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
};

/**
 * Get current time in HH:mm format
 */
export const getCurrentTime = (): string => {
  return format(new Date(), 'HH:mm');
};
