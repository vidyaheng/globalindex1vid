import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import InputField from '../components/InputField';
import DropdownField from '../components/DropdownField';
import Button from '../components/Button';
import { FormData } from '../types'; // ตรวจสอบ path import
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/formatters'; // ตรวจสอบ path import
import { FaExchangeAlt } from 'react-icons/fa'; // ตรวจสอบ path import

// --- ค่าคงที่ ---
const MIN_SUM_ASSURED = 20000;
const MIN_PREMIUM = 20000;
const SESSION_STORAGE_PREFIX = 'InputPage_'; // Prefix ป้องกัน Key ชน

// --- Helper Function อ่านค่าจาก sessionStorage ---
const getStateFromSessionStorage = <T,>(key: string, defaultValue: T, isNumber: boolean = false): T => {
    const savedValue = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${key}`);
    if (savedValue !== null) {
        try {
            if (isNumber) {
                const num = parseInt(savedValue, 10);
                if (!isNaN(num)) return num as T; // ใช้ as T ตรงๆ ได้ถ้ามั่นใจ หรือจัดการ Type ให้ดีกว่านี้
            } else {
                return savedValue as T;
            }
        } catch (error) {
            console.error(`Error parsing sessionStorage key "${key}":`, error);
            sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${key}`);
        }
    }
    return defaultValue;
};

const InputPage: React.FC = () => {
  const navigate = useNavigate();

  // --- State Management (อ่านจาก sessionStorage ก่อน) ---
  const [age, setAge] = useState<number>(() => getStateFromSessionStorage('age', 30, true));
  const [expectedReturn, setExpectedReturn] = useState<string>(() => getStateFromSessionStorage('expectedReturn', '5'));
  const [taxBase, setTaxBase] = useState<string>(() => getStateFromSessionStorage('taxBase', '20'));
  const [sumAssured, setSumAssured] = useState<number>(() => getStateFromSessionStorage('sumAssured', 100000, true));
  const [premium, setPremium] = useState<number>(0); // Premium คำนวณเริ่มต้นใน useEffect
  const [isCalculating, setIsCalculating] = useState<boolean>(false); // State เดิมสำหรับกันการคำนวณซ้อน

  // --- State สำหรับ Validation Errors ---
  const [sumAssuredError, setSumAssuredError] = useState<string>('');
  const [premiumError, setPremiumError] = useState<string>('');
  // เพิ่ม error state สำหรับ field อื่นๆ ถ้าต้องการ validate เช่น
  const [expectedReturnError, setExpectedReturnError] = useState<string>('');
  const [taxBaseError, setTaxBaseError] = useState<string>('');


  // --- ตัวเลือกอายุ ---
  const ageOptions = Array.from({ length: 71 }, (_, i) => ({ value: i, label: `${i} ปี` }));

  // --- ฟังก์ชันคำนวณ Premium ---
  const calculatePremium = useCallback((currentSumAssured: number): number => {
        if (currentSumAssured < MIN_SUM_ASSURED) return 0;
        if (currentSumAssured >= 500000) return Math.round(currentSumAssured * 0.99);
        if (currentSumAssured >= 100000) return Math.round(currentSumAssured * 0.995);
        return currentSumAssured;
   }, []);

  // --- ฟังก์ชันคำนวณ Sum Assured ---
  const calculateSumAssured = useCallback((currentPremium: number): number => {
       if (currentPremium < MIN_PREMIUM) return 0;
       const saFromP99 = currentPremium / 0.99;
       const saFromP995 = currentPremium / 0.995;
       if (saFromP99 >= 500000 && Math.abs(saFromP99 * 0.99 - currentPremium) < 0.01) return Math.round(saFromP99);
       if (saFromP995 >= 100000 && saFromP995 < 500000 && Math.abs(saFromP995 * 0.995 - currentPremium) < 0.01) return Math.round(saFromP995);
       if (currentPremium >= MIN_PREMIUM && currentPremium < 99500) return Math.round(currentPremium);
       // ให้ default กลับไปที่ค่า premium ถ้าไม่เข้าเงื่อนไข rate พิเศษ
       if (currentPremium >= MIN_PREMIUM) return currentPremium;
       return 0;
   }, []);

  // --- useEffect: คำนวณ Premium เริ่มต้น (เมื่อ sumAssured พร้อม) ---
  useEffect(() => {
    const initialCalculatedPremium = calculatePremium(sumAssured);
    // อัปเดตเฉพาะเมื่อค่าต่างกันจริงๆ เพื่อป้องกัน loop ถ้า premium ก็ถูกโหลดมาจาก storage ด้วย
    // (ถึงแม้ตอนนี้เราจะ init premium เป็น 0 ก็ตาม)
    if (initialCalculatedPremium !== premium) {
        setPremium(initialCalculatedPremium);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sumAssured, calculatePremium]); // ไม่ใส่ premium ใน dependency array

  // --- useEffect: Save ทุก State ลง sessionStorage ---
  useEffect(() => { sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}age`, String(age)); }, [age]);
  useEffect(() => { sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}expectedReturn`, expectedReturn); }, [expectedReturn]);
  useEffect(() => { sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}taxBase`, taxBase); }, [taxBase]);
  useEffect(() => { sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}sumAssured`, String(sumAssured)); }, [sumAssured]);
  useEffect(() => { sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}premium`, String(premium)); }, [premium]);

  // --- Validation Logic ---
  const validateField = useCallback((name: string, value: string | number): string => {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;

      switch (name) {
          case 'sumAssured':
              if (isNaN(numericValue) || numericValue < MIN_SUM_ASSURED) return `ขั้นต่ำคือ ${formatNumberWithCommas(MIN_SUM_ASSURED)}`;
              break;
          case 'premium':
              if (isNaN(numericValue) || numericValue < MIN_PREMIUM) return `ขั้นต่ำคือ ${formatNumberWithCommas(MIN_PREMIUM)}`;
              break;
          case 'expectedReturn':
              if (String(value).trim() === '') return ''; // อนุญาตค่าว่าง
              if (isNaN(numericValue) || numericValue < 0) return 'ผลตอบแทนต้องไม่ติดลบ';
              break;
          case 'taxBase':
              if (String(value).trim() === '') return ''; // อนุญาตค่าว่าง
              if (isNaN(numericValue) || numericValue < 0) return 'ฐานภาษีต้องไม่ติดลบ';
              break;
          // เพิ่ม case สำหรับ field อื่นๆ ถ้าต้องการ
      }
      return ''; // ไม่มี Error
  }, []); // useCallback ถ้าไม่มี dependency ภายนอก

  // --- Event Handlers ---
  const handleAgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
       setAge(Number(e.target.value));
   };

  const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const { name, value } = e.target;
       let error = '';
       if (name === 'expectedReturn') {
           setExpectedReturn(value);
           error = validateField(name, value);
           setExpectedReturnError(error);
       } else if (name === 'taxBase') {
           setTaxBase(value);
           error = validateField(name, value);
           setTaxBaseError(error);
       }
   };

  const handleSumAssuredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCalculating) return;
    setIsCalculating(true);
    const valueString = e.target.value;
    const v = parseFormattedNumber(valueString);

    const error = validateField('sumAssured', v);
    setSumAssuredError(error);

    if (v >= 0) { // อนุญาตให้กรอก 0 แต่จะติด error ข้างบน
      setSumAssured(v);
      const calculatedP = calculatePremium(v);
      setPremium(calculatedP);
      // ถ้า SA ผ่าน หรือ SA ไม่ผ่านแต่ P ที่คำนวณได้ > MIN ให้เคลียร์ P error
      const pError = validateField('premium', calculatedP);
      setPremiumError(pError); // ตั้งค่า P error ตามค่าที่คำนวณได้

    }
    setTimeout(() => setIsCalculating(false), 0);
  };

  const handlePremiumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCalculating) return;
    setIsCalculating(true);
    const valueString = e.target.value;
    const v = parseFormattedNumber(valueString);

    const error = validateField('premium', v);
    setPremiumError(error);

    if (v >= 0) {
      setPremium(v);
      const calculatedSA = calculateSumAssured(v);
      setSumAssured(calculatedSA);
      // ถ้า P ผ่าน หรือ P ไม่ผ่านแต่ SA ที่คำนวณได้ > MIN ให้เคลียร์ SA error
      const saError = validateField('sumAssured', calculatedSA);
      setSumAssuredError(saError); // ตั้งค่า SA error ตามค่าที่คำนวณได้
    }
    setTimeout(() => setIsCalculating(false), 0);
  };


  // --- Handler การกดปุ่มคำนวณ ---
  const handleCalculate = () => {
    // --- Re-validate ทุก Field ที่จำเป็น ---
    const currentSAError = validateField('sumAssured', sumAssured);
    const currentPError = validateField('premium', premium);
    const currentExpectedReturnError = validateField('expectedReturn', expectedReturn);
    const currentTaxBaseError = validateField('taxBase', taxBase);

    // --- อัปเดต Error State ---
    setSumAssuredError(currentSAError);
    setPremiumError(currentPError);
    setExpectedReturnError(currentExpectedReturnError);
    setTaxBaseError(currentTaxBaseError);

    // --- ตรวจสอบว่ามี Error หรือไม่ ---
    if (currentSAError || currentPError || currentExpectedReturnError || currentTaxBaseError) {
      console.error("Form has validation errors. Cannot navigate.");
      return; // หยุดทำงาน
    }

    // --- ถ้าผ่านหมด: สร้าง formData ---
    // Parse ค่าที่เป็น string ให้เป็น number ก่อนสร้าง Object
    const currentExpectedReturnNum = parseFloat(expectedReturn) || 0;
    const currentTaxBaseNum = parseFloat(taxBase) || 0;

    const formData: FormData = {
        age: Number(age),
        expectedReturn: currentExpectedReturnNum,
        taxBase: currentTaxBaseNum,
        sumAssured: sumAssured,
        premium: premium
        // เพิ่ม gender และ field อื่นๆ ถ้ามีใน type FormData
    };

    console.log("Navigating with formData:", formData);
    // ★★★ ไม่ต้องส่ง state เพราะ ResultPage จะอ่านจาก sessionStorage ★★★
    navigate('/result');
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-100">
      <Header titleLine1="แผนการเงิน" titleLine2="Global Index 16/6" line1Small={false} />

      <div className="container mx-auto p-12 max-w-md bg-white mt-8 rounded shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-center text-gray-700">
          ข้อมูลสำหรับวางแผน Global Index 16/6
        </h3>

        {/* --- Form Fields --- */}
        {/* ใช้ div หรือ form element ก็ได้ ถ้าใช้ form อาจจะต้องใส่ onSubmit */}
        <div className="space-y-5 max-w-md mx-auto">
          <DropdownField
            label="อายุ:"
            id="age"
            value={age}
            onChange={handleAgeChange}
            options={ageOptions}
            labelPosition="left"
            className="items-center"
          />
          <InputField
            label="ผลตอบแทนที่คาดหวังจากดัชนี Citi Grandmaster RCS (%):"
            id="expectedReturn"
            name="expectedReturn" // ใส่ name attribute ให้ handler รู้จัก
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={expectedReturn}
            onChange={handleOtherInputChange} // ใช้ handler กลาง
            labelPosition="left"
            className="items-center"
            error={expectedReturnError} // ส่ง error state
          />
          <InputField
            label="ลดหย่อนภาษี (%):"
            id="taxBase"
            name="taxBase" // ใส่ name attribute
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={taxBase}
            onChange={handleOtherInputChange} // ใช้ handler กลาง
            labelPosition="left"
            className="items-center"
            error={taxBaseError} // ส่ง error state
          />
        </div>

        <div className="mt-5 space-y-5">
          <div className="flex items-start gap-4 justify-center w-full">
            <div className="flex-1">
              <label htmlFor="sumAssured" className="block text-sm font-medium text-gray-700 mb-1 text-left pl-2">ทุนประกัน</label>
              <InputField
                label=""
                id="sumAssured"
                name="sumAssured" // ใส่ name ด้วย
                value={formatNumberWithCommas(sumAssured)}
                onChange={handleSumAssuredChange}
                type="text"
                inputMode="numeric"
                inputClassName="text-left"
                labelPosition='top'
                error={sumAssuredError} // ★★★ ส่ง Error message ★★★
              />
            </div>
            <div className="mt-8">
              <FaExchangeAlt className="text-blue-800 text-xl" />
            </div>
            <div className="flex-1">
              <label htmlFor="premium" className="block text-sm font-medium text-gray-700 mb-1 text-right pr-2">เบี้ยประกัน</label>
              <InputField
                label=""
                id="premium"
                name="premium" // ใส่ name ด้วย
                value={formatNumberWithCommas(premium)}
                onChange={handlePremiumChange}
                type="text"
                inputMode="numeric"
                inputClassName="text-right"
                labelPosition='top'
                error={premiumError} // ★★★ ส่ง Error message ★★★
              />
            </div>
          </div>

          <div className="pt-5">
            <Button label="คำนวณ" onClick={handleCalculate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputPage;