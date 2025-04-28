import React from 'react';

interface InputFieldProps {
  label: string;
  id: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  labelPosition?: 'top' | 'left';
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
  labelClassName?: string; // Prop นี้อาจจะไม่จำเป็นแล้วถ้าใช้ Grid
  inputClassName?: string; // Prop นี้ยังใช้ได้สำหรับสไตล์อื่นๆ ที่ไม่ใช่ layout
  inputMode?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  className = '',
  labelPosition = 'top',
  required = false,
  step,
  min,
  max,
  labelClassName = '', // รับ prop มา แต่ไม่ควรใช้กำหนด width แล้ว
  inputClassName = '',
}) => {
  // --- ใช้ Grid สำหรับ labelPosition 'left' ---
  // ปรับ 150px ตามความยาว Label ที่เหมาะสม
  const layoutClasses = labelPosition === 'left'
    ? 'grid grid-cols-[230px_1fr] gap-x-3 items-center' // Grid: คอลัมน์ label กว้าง 150px, คอลัมน์ input กินที่เหลือ
    : 'block'; // ถ้าเป็น 'top' ใช้ block ปกติ

  const labelBaseClasses = "block text-sm font-medium text-gray-700";
  const inputBaseClasses = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-left";

  return (
    <div className={`${layoutClasses} ${className}`}>
      <label
        htmlFor={id}
        // ถ้าเป็น 'left' ให้ชิดขวา / ถ้า 'top' ให้มี margin-bottom
        className={`${labelBaseClasses} ${labelClassName} ${labelPosition === 'left' ? 'text-right' : 'mb-1'}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        max={max}
        // inputMode={inputMode} // ใส่ inputMode ถ้ามีการส่ง prop นี้มา
        // ลบ class ที่เกี่ยวกับ layout เดิมออกเมื่อ labelPosition='left'
        className={`${inputBaseClasses} ${inputClassName}`}
      />
    </div>
  );
};

export default InputField;