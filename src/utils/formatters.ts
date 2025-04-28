// ฟังก์ชันสำหรับใส่ comma ให้ตัวเลข
export const formatNumberWithCommas = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return String(value); // Return original string if not a valid number
    // Use Intl.NumberFormat for robust formatting
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  // ฟังก์ชันสำหรับลบ comma ออกจาก string ตัวเลข
  export const parseFormattedNumber = (value: string): number => {
    const num = Number(value.replace(/,/g, ''));
    return isNaN(num) ? 0 : num; // Return 0 if parsing fails
  };