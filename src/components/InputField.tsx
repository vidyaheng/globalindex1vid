// --- InputField.tsx (แก้ไข) ---
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
  min?: string; // เรายังใช้ min/max สำหรับ HTML5 validation พื้นฐานได้
  max?: string;
  labelClassName?: string;
  inputClassName?: string;
  inputMode?: "text" | "search" | "email" | "tel" | "url" | "none" | "numeric" | "decimal"; // <-- ใช้ Union Type ที่ถูกต้อง
  error?: string; // ★★★ เพิ่ม Prop สำหรับรับข้อความ Error ★★★
  name?: string;
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
  min, // ยังคงรับค่า min/max มาได้
  max,
  labelClassName = '',
  inputClassName = '',
  inputMode, // เพิ่ม inputMode ถ้ามีการใช้งาน
  error,     // ★★★ รับ Prop error เข้ามา ★★★
  name,
}) => {
  const layoutClasses = labelPosition === 'left'
    ? 'grid grid-cols-[230px_1fr] gap-x-3 items-center'
    : 'block';

  const labelBaseClasses = "block text-sm font-medium text-gray-700";
  // ★ เพิ่มเงื่อนไขให้ input มี border สีแดง ถ้ามี error ★
  const inputBaseClasses = `block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-left ${
    error ? 'border-red-500' : 'border-gray-300' // ถ้ามี error ใช้ border แดง
  }`;

  return (
    // ★ ปรับ margin ของ div หลักเล็กน้อยถ้า label อยู่ด้านบน เพื่อให้มีที่สำหรับ error message ★
    <div className={`${layoutClasses} ${className} ${labelPosition === 'top' ? 'mb-2' : ''}`}>
      <label
        htmlFor={id}
        className={`${labelBaseClasses} ${labelClassName} ${labelPosition === 'left' ? 'text-right' : 'mb-1'}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {/* ★ สำหรับ layout 'left', input และ error ควรอยู่กลุ่มเดียวกัน ★ */}
      <div className={labelPosition === 'left' ? 'flex flex-col' : ''}>
          <input
            type={type}
            id={id}
            name={name ?? id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            step={step}
            min={min} // ใส่ min/max attribute ให้ input โดยตรงด้วย เพื่อประโยชน์อื่นๆ
            max={max}
            inputMode={inputMode} // ใส่ inputMode ถ้ามีการส่ง prop นี้มา
            className={`${inputBaseClasses} ${inputClassName}`}
            aria-invalid={!!error} // ★ บอก Screen Reader ว่า input นี้ไม่ valid ถ้ามี error ★
            aria-describedby={error ? `${id}-error` : undefined} // ★ เชื่อม input กับ error message ★
          />
          {/* ★★★ ส่วนแสดงข้อความ Error ★★★ */}
          {error && (
            <p
              id={`${id}-error`} // ★ ID สำหรับ aria-describedby ★
              className="mt-1 text-xs text-red-600" // ★ Style ของข้อความ Error ★
              role="alert" // ★ บอกว่าเป็น alert ★
            >
              {error}
            </p>
          )}
       </div>
    </div>
  );
};

export default InputField;