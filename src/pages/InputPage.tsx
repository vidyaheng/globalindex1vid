import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // ตรวจสอบ path import
import InputField from '../components/InputField'; // ตรวจสอบ path import
import DropdownField from '../components/DropdownField'; // ตรวจสอบ path import
import Button from '../components/Button'; // ตรวจสอบ path import
import { FormData } from '../types'; // ตรวจสอบ path import
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/formatters'; // ตรวจสอบ path import
import { FaExchangeAlt } from 'react-icons/fa'; // ตรวจสอบ path import

const InputPage: React.FC = () => {
  const navigate = useNavigate();
  const [age, setAge] = useState<number>(30);
  const [expectedReturn, setExpectedReturn] = useState<string>('5');
  const [taxBase, setTaxBase] = useState<string>('20');
  const [sumAssured, setSumAssured] = useState<number>(100000);
  const [premium, setPremium] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const ageOptions = Array.from({ length: 71 }, (_, i) => ({ value: i, label: `${i} ปี` }));

  const calculatePremium = useCallback((currentSumAssured: number): number => {
        if (currentSumAssured >= 500000) return currentSumAssured * 0.99;
        if (currentSumAssured >= 100000) return currentSumAssured * 0.995;
        if (currentSumAssured >= 20000) return currentSumAssured;
        return 0;
   }, []);

  const calculateSumAssured = useCallback((currentPremium: number): number => {
       // --- Logic คำนวณทุนจากเบี้ย (เหมือนเดิม) ---
       const saFromP99 = currentPremium / 0.99;
       const saFromP995 = currentPremium / 0.995;
       if (saFromP99 >= 500000 && Math.abs(saFromP99 * 0.99 - currentPremium) < 0.01) return Math.round(saFromP99);
       if (saFromP995 >= 100000 && saFromP995 < 500000 && Math.abs(saFromP995 * 0.995 - currentPremium) < 0.01) return Math.round(saFromP995);
       if (currentPremium >= 20000 && currentPremium < 99500) return Math.round(currentPremium);
       if (currentPremium >= 20000 && currentPremium <= 99999) return currentPremium;
       console.warn("Could not accurately reverse calculate Sum Assured for premium:", currentPremium);
       if (saFromP995 >= 100000) return Math.round(saFromP995);
       if (currentPremium >= 20000) return currentPremium;
       return 0;
       // --- สิ้นสุด Logic ---
  }, []);

  useEffect(() => { setPremium(calculatePremium(sumAssured)); }, [sumAssured, calculatePremium]);

  const handleSumAssuredChange = (e: React.ChangeEvent<HTMLInputElement>) => { if(isCalculating) return; setIsCalculating(true); const v = parseFormattedNumber(e.target.value); if(v>=0){ setSumAssured(v); setPremium(calculatePremium(v)); } setTimeout(()=>setIsCalculating(false),0); };
  const handlePremiumChange = (e: React.ChangeEvent<HTMLInputElement>) => { if(isCalculating) return; setIsCalculating(true); const v = parseFormattedNumber(e.target.value); if(v>=0){ setPremium(v); setSumAssured(calculateSumAssured(v)); } setTimeout(()=>setIsCalculating(false),0); };

  const handleCalculate = () => {
    const formData: FormData = { age: Number(age), expectedReturn: parseFloat(expectedReturn) || 0, taxBase: parseFloat(taxBase) || 0, sumAssured: sumAssured, premium: premium };
    if (formData.sumAssured < 20000) { alert("ทุนประกันต้องมีค่าอย่างน้อย 20,000"); return; }
    if (formData.expectedReturn < 0 || formData.taxBase < 0) { alert("ผลตอบแทนและฐานภาษีต้องไม่ติดลบ"); return; }
    navigate('/result', { state: { formData } });
  };

  return (
    // พื้นหลังเทาอ่อน
    <div className="min-h-screen bg-gray-100">
      <Header titleLine1="แผนการเงิน" titleLine2="Global Index 16/6" line1Small={false} />

      {/* Card สีขาว จัดกลาง */}
      <div className="container mx-auto p-12 max-w-md bg-white mt-8 rounded shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-center text-gray-700"> {/* แก้เป็น gray */}
          ข้อมูลสำหรับวางแผน Global Index 16/6
        </h3>

        {/* --- จัดกลุ่ม Input 3 อันบน ให้อยู่กลาง Card --- */}
        <div className="space-y-5 max-w-md mx-auto"> {/* <<< เพิ่ม max-w-md mx-auto */}

          {/* DropdownField อายุ */}
          <DropdownField
            label="อายุ:"
            id="age"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            options={ageOptions}
            labelPosition="left" // Component จะใช้ Grid layout
            className="items-center"
            // ไม่ต้องใส่ labelClassName หรือ selectClassName ที่เกี่ยวกับ width
          />

          {/* InputField ผลตอบแทน */}
          <InputField
            label="ผลตอบแทนที่คาดหวังจากดัชนี Citi Grandmaster RCS (%):"
            id="expectedReturn"
            type="number"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            labelPosition="left" // Component จะใช้ Grid layout
            className="items-center"
             // ไม่ต้องใส่ labelClassName ที่เกี่ยวกับ width
          />

          {/* InputField ฐานภาษี */}
          <InputField
            label="ลดหย่อนภาษี (%):"
            id="taxBase"
            type="number"
            value={taxBase}
            onChange={(e) => setTaxBase(e.target.value)}
            labelPosition="left" // Component จะใช้ Grid layout
            className="items-center"
             // ไม่ต้องใส่ labelClassName ที่เกี่ยวกับ width
          />
        </div> {/* ปิด div max-w-md mx-auto */}

         {/* --- ส่วน ทุน/เบี้ย และ ปุ่ม (วางนอก group จัดกลาง) --- */}
         <div className="mt-5 space-y-5"> {/* เพิ่ม mt-5 เพื่อเว้นระยะ */}
            {/* Sum Assured and Premium Row */}
            <div className="flex items-center gap-4 justify-center w-full">
                {/* Sum Assured */}
                <div className="flex-1">
                <label htmlFor="sumAssured" className="block text-sm font-medium text-gray-700 mb-1 text-left pl-2">ทุนประกัน</label>
                <InputField
                    label="" id="sumAssured" value={formatNumberWithCommas(sumAssured)} onChange={handleSumAssuredChange}
                    type="text" inputMode="numeric" inputClassName="text-left" labelPosition='top' // ใช้ labelPosition top
                />
                </div>
                {/* Icon */}
                <div className="mt-6">
                <FaExchangeAlt className="text-gray-500 text-xl" />
                </div>
                {/* Premium */}
                <div className="flex-1">
                <label htmlFor="premium" className="block text-sm font-medium text-gray-700 mb-1 text-right pr-2">เบี้ยประกัน</label>
                <InputField
                    label="" id="premium" value={formatNumberWithCommas(premium)} onChange={handlePremiumChange}
                    type="text" inputMode="numeric" inputClassName="text-right" labelPosition='top' // ใช้ labelPosition top
                />
                </div>
            </div>

            {/* Calculation Button */}
            <div className="pt-5">
                <Button label="คำนวณ" onClick={handleCalculate} />
            </div>
         </div>

      </div> {/* ปิด Card div */}
    </div> 
  );
};

export default InputPage;