import React from 'react';

interface DropdownFieldProps {
  label: string;
  id: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  className?: string;
  labelPosition?: 'top' | 'left';
  required?: boolean;
  labelClassName?: string; // Prop นี้อาจจะไม่จำเป็นแล้วถ้าใช้ Grid
  selectClassName?: string; // Prop นี้ยังใช้ได้สำหรับสไตล์อื่นๆ ที่ไม่ใช่ layout
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  id,
  value,
  onChange,
  options,
  className = '',
  labelPosition = 'left', // Default to left like the image
  required = false,
  labelClassName = '', // รับ prop มา แต่ไม่ควรใช้กำหนด width แล้ว
  selectClassName = '',
}) => {
  // --- ใช้ Grid สำหรับ labelPosition 'left' (เหมือน InputField) ---
  // ปรับ 150px ตามความยาว Label ที่เหมาะสม
  const layoutClasses = labelPosition === 'left'
    ? 'grid grid-cols-[230px_1fr] gap-x-3 items-center' // ใช้ Grid เหมือน InputField
    : 'block';

  const labelBaseClasses = "block text-sm font-medium text-gray-700";
  // อย่าลืม bg-white สำหรับ select
  const selectBaseClasses = "block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white";

  return (
    <div className={`${layoutClasses} ${className}`}>
      <label
        htmlFor={id}
         // ถ้าเป็น 'left' ให้ชิดขวา / ถ้า 'top' ให้มี margin-bottom
        className={`${labelBaseClasses} ${labelClassName} ${labelPosition === 'left' ? 'text-right' : 'mb-1'}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        // ลบ class ที่เกี่ยวกับ layout เดิมออกเมื่อ labelPosition='left'
        className={`${selectBaseClasses} ${selectClassName}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropdownField;