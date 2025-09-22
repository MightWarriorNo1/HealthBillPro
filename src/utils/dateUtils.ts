// Date formatting utilities for the billing application

export const formatDateMMDDYY = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);
  
  return `${month}-${day}-${year}`;
};

export const formatDateMMDD = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${month}-${day}`;
};

export const formatDateToMonth = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return months[dateObj.getMonth()];
};

export const getMonthColor = (month: string): string => {
  const colorMap: Record<string, string> = {
    'Jan': 'bg-red-100 text-red-800',
    'Feb': 'bg-pink-100 text-pink-800',
    'Mar': 'bg-green-100 text-green-800',
    'Apr': 'bg-blue-100 text-blue-800',
    'May': 'bg-yellow-100 text-yellow-800',
    'Jun': 'bg-indigo-100 text-indigo-800',
    'Jul': 'bg-purple-100 text-purple-800',
    'Aug': 'bg-orange-100 text-orange-800',
    'Sep': 'bg-teal-100 text-teal-800',
    'Oct': 'bg-gray-100 text-gray-800',
    'Nov': 'bg-red-200 text-red-900',
    'Dec': 'bg-green-200 text-green-900'
  };
  
  return colorMap[month] || 'bg-gray-100 text-gray-800';
};

export const parseDateInput = (input: string): string => {
  // Handle various date input formats
  if (!input) return '';
  
  // If it's already in MM-DD-YY format, convert to ISO
  if (/^\d{2}-\d{2}-\d{2}$/.test(input)) {
    const [month, day, year] = input.split('-');
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If it's in MM-DD format, assume current year
  if (/^\d{2}-\d{2}$/.test(input)) {
    const [month, day] = input.split('-');
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If it's already in ISO format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  
  // Try to parse as a date and convert to ISO
  const date = new Date(input);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return input;
};


