/**
 * Date formatting utilities using date-fns
 */
import {
  format,
  formatDistance,
  formatRelative,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  parseISO,
  differenceInDays,
  addDays,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  differenceInMinutes
} from 'date-fns';

/**
 * Format a date with a specified format string
 * @param {Date|string|number} date - The date to format
 * @param {string} formatStr - The format string (default: 'PP')
 * @returns {string} - The formatted date
 */
export function formatDate(date, formatStr = 'PP') {
  if (!date) return '';
  
  // Parse ISO string if needed
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format a time with a specified format string
 * @param {Date|string|number} date - The date to format
 * @param {string} formatStr - The format string (default: 'p')
 * @returns {string} - The formatted time
 */
export function formatTime(date, formatStr = 'p') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format a datetime with a specified format string
 * @param {Date|string|number} date - The date to format
 * @param {string} formatStr - The format string (default: 'PPp')
 * @returns {string} - The formatted datetime
 */
export function formatDateTime(date, formatStr = 'PPp') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Get a human-readable relative time (e.g., "5 minutes ago")
 * @param {Date|string|number} date - The date to format
 * @param {Date} baseDate - The base date to compare to (default: now)
 * @returns {string} - The relative time
 */
export function getRelativeTime(date, baseDate = new Date()) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, baseDate, { addSuffix: true });
}

/**
 * Get a smart formatted date that changes based on how recent it is
 * @param {Date|string|number} date - The date to format
 * @returns {string} - The smart formatted date
 */
export function getSmartDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  
  // If less than 1 minute ago
  if (differenceInMinutes(now, dateObj) < 1) {
    return 'Just now';
  }
  
  // If less than 1 hour ago
  if (differenceInMinutes(now, dateObj) < 60) {
    return getRelativeTime(dateObj, now);
  }
  
  // If today
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'p')}`;
  }
  
  // If yesterday
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'p')}`;
  }
  
  // If this week
  if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE') + ` at ${format(dateObj, 'p')}`;
  }
  
  // If this year
  if (isThisYear(dateObj)) {
    return format(dateObj, 'MMM d') + ` at ${format(dateObj, 'p')}`;
  }
  
  // Otherwise, show full date
  return format(dateObj, 'PPp');
}

/**
 * Format a date range
 * @param {Date|string|number} startDate - The start date
 * @param {Date|string|number} endDate - The end date
 * @returns {string} - The formatted date range
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  // If same day
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return `${format(start, 'PP')} ${format(start, 'p')} - ${format(end, 'p')}`;
  }
  
  // If same month and year
  if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }
  
  // If same year
  if (format(start, 'yyyy') === format(end, 'yyyy')) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  
  // Different years
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Check if a date is in the past
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} - True if the date is in the past
 */
export function isPast(date) {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Check if a date is in the future
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} - True if the date is in the future
 */
export function isFuture(date) {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Add a specified amount of time to a date
 * @param {Date|string|number} date - The date to add to
 * @param {Object} duration - The duration to add
 * @param {number} duration.days - Days to add
 * @param {number} duration.months - Months to add
 * @param {number} duration.years - Years to add
 * @returns {Date} - The new date
 */
export function addTime(date, duration = {}) {
  if (!date) return new Date();
  
  const { days = 0, months = 0, years = 0 } = duration;
  let result = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  if (days) result = addDays(result, days);
  if (months) result = addMonths(result, months);
  if (years) result = addYears(result, years);
  
  return result;
} 