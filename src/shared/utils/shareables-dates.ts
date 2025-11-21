/**
 * Date utilities for shareables calendarization system
 * Handles date calculations, month boundaries, leap years, etc.
 */

/**
 * Calculates consecutive dates from a start date
 * Handles month boundaries and leap years automatically
 *
 * @param startDate - Starting date (ISO string or Date object)
 * @param days - Number of consecutive days to generate
 * @returns Array of ISO date strings (YYYY-MM-DD format)
 *
 * @example
 * generateConsecutiveDates('2025-01-30', 5)
 * // Returns: ['2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03']
 */
export function generateConsecutiveDates(startDate: string | Date, days: number): string[] {
  if (days <= 0) {
    return [];
  }

  // Parse ISO date string manually to avoid timezone issues
  let startYear: number;
  let startMonth: number;
  let startDay: number;

  if (typeof startDate === 'string') {
    const parts = startDate.split('-');
    startYear = parseInt(parts[0], 10);
    startMonth = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    startDay = parseInt(parts[2], 10);
  } else {
    startYear = startDate.getFullYear();
    startMonth = startDate.getMonth();
    startDay = startDate.getDate();
  }

  const dates: string[] = [];

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startYear, startMonth, startDay + i);
    dates.push(formatDateToISO(currentDate));
  }

  return dates;
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 * Removes time component, only returns date
 *
 * @param date - Date object to format
 * @returns ISO date string (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses an ISO date string to Date object
 *
 * @param isoString - ISO date string (YYYY-MM-DD)
 * @returns Date object
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString + 'T00:00:00');
}

/**
 * Calculates the end date from start date and number of days
 *
 * @param startDate - Starting date (ISO string or Date)
 * @param days - Number of days
 * @returns End date as ISO string (YYYY-MM-DD)
 */
export function calculateEndDate(startDate: string | Date, days: number): string {
  const start = typeof startDate === 'string' ? parseISODate(startDate) : startDate;
  const endDate = new Date(start);
  endDate.setDate(start.getDate() + days - 1);
  return formatDateToISO(endDate);
}

/**
 * Validates that a date string is in correct ISO format (YYYY-MM-DD)
 *
 * @param dateString - Date string to validate
 * @returns True if valid ISO date format
 */
export function isValidISODate(dateString: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  const date = parseISODate(dateString);
  return !isNaN(date.getTime()) && formatDateToISO(date) === dateString;
}

/**
 * Gets today's date as ISO string
 *
 * @returns Today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return formatDateToISO(new Date());
}

/**
 * Checks if a date is in the past
 *
 * @param date - Date to check (ISO string or Date)
 * @returns True if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const checkDate = typeof date === 'string' ? parseISODate(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Checks if a date is today
 *
 * @param date - Date to check (ISO string or Date)
 * @returns True if date is today
 */
export function isToday(date: string | Date): boolean {
  const checkDate = typeof date === 'string' ? parseISODate(date) : date;
  const today = getTodayISO();
  const checkISO = formatDateToISO(checkDate);
  return checkISO === today;
}

/**
 * Gets the number of days between two dates (inclusive)
 *
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 * @returns Number of days between dates (inclusive)
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? parseISODate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISODate(endDate) : endDate;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 to make it inclusive
}

/**
 * Gets the day of week as text (e.g., "Sunday", "Monday")
 *
 * @param date - Date (ISO string or Date object)
 * @returns Day of week name
 */
export function getDayOfWeekName(date: string | Date): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()];
}

/**
 * Gets the ISO week number of the year (1-53)
 * Uses ISO 8601 week numbering standard
 *
 * @param date - Date (ISO string or Date object)
 * @returns Week number (1-53)
 */
export function getWeekOfYear(date: string | Date): number {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const dateObj = new Date(d.getTime());
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayOfWeek = dateObj.getDay() || 7;
  dateObj.setDate(dateObj.getDate() + 4 - dayOfWeek);
  
  // Get first day of year
  const yearStart = new Date(dateObj.getFullYear(), 0, 1);
  
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(((dateObj.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  
  return weekNo;
}

/**
 * Detects special occasions/holidays for a given date
 *
 * @param date - Date (ISO string or Date object)
 * @returns Special occasion name or null
 */
export function getSpecialOccasion(date: string | Date): string | null {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();
  
  // New Year's Day
  if (month === 1 && day === 1) return 'New Year\'s Day';
  
  // Valentine's Day
  if (month === 2 && day === 14) return 'Valentine\'s Day';
  
  // St. Patrick's Day
  if (month === 3 && day === 17) return 'St. Patrick\'s Day';
  
  // Easter (simplified - would need proper calculation for actual Easter)
  // For now, we'll skip Easter as it's complex
  
  // Halloween
  if (month === 10 && day === 31) return 'Halloween';
  
  // Christmas
  if (month === 12 && day === 25) return 'Christmas';
  
  // New Year's Eve
  if (month === 12 && day === 31) return 'New Year\'s Eve';
  
  return null;
}

/**
 * Detects special hockey seasons for a given date
 * This is a simplified version - you may want to customize based on actual NHL schedule
 *
 * @param date - Date (ISO string or Date object)
 * @returns Special season name or null
 */
export function getSpecialSeason(date: string | Date): string | null {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const month = d.getMonth() + 1; // 1-12
  
  // Playoffs typically run April-June
  if (month >= 4 && month <= 6) {
    return 'Playoffs';
  }
  
  // Regular season typically runs October-April
  if (month === 10 || month === 11 || month === 12 || month === 1 || month === 2 || month === 3) {
    return 'Regular Season';
  }
  
  // Off-season typically July-September
  if (month >= 7 && month <= 9) {
    return 'Off-Season';
  }
  
  return null;
}
