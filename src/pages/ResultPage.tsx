import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom'; // เอา useLocation ออก
import Header from '../components/Header';
import ResultTable from '../components/ResultTable'; // ตรวจสอบ path
import ResultChart from '../components/ResultChart'; // ตรวจสอบ path
import { performCalculations } from '../utils/calculations'; // ตรวจสอบ path
import { FormData, CalculationResults } from '../types'; // ตรวจสอบ path
import { FaArrowLeft } from 'react-icons/fa';

// --- ★★★ ใช้ค่าคงที่และ Helper Function เดียวกับ InputPage ★★★ ---
const SESSION_STORAGE_PREFIX = 'InputPage_';
const MIN_SUM_ASSURED_FOR_RESULT = 20000; // ค่าต่ำสุดที่ยอมรับในหน้านี้

const getStateFromSessionStorage = <T,>(key: string, defaultValue: T, isNumber: boolean = false): T => {
    const savedValue = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${key}`);
    if (savedValue !== null) {
        try {
            if (isNumber) {
                const num = parseInt(savedValue, 10);
                if (!isNaN(num)) return num as T;
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

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'table' | 'graph'>('table');
  const [includeTaxInIRR, setIncludeTaxInIRR] = useState<boolean>(false);
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);

  // --- ★★★ อ่านข้อมูลจาก sessionStorage ★★★ ---
  // ใช้ useState เพื่ออ่านครั้งเดียวตอน Component โหลด
  const [formData] = useState<FormData | null>(() => {
    console.log("ResultPage: Attempting to read from sessionStorage...");
    const age = getStateFromSessionStorage('age', 0, true);
    const expectedReturnStr = getStateFromSessionStorage('expectedReturn', '0');
    const taxBaseStr = getStateFromSessionStorage('taxBase', '0');
    const sumAssured = getStateFromSessionStorage('sumAssured', 0, true);
    const premium = getStateFromSessionStorage('premium', 0, true);

    // ★★★ ตรวจสอบความสมเหตุสมผลของข้อมูลที่อ่านได้ ★★★
    // ต้องมีอย่างน้อย ทุนประกัน หรือ เบี้ยประกัน ที่มากกว่าหรือเท่ากับขั้นต่ำ
    if (sumAssured >= MIN_SUM_ASSURED_FOR_RESULT || premium >= 20000 /* ใช้ MIN_PREMIUM ถ้ามี */) {
        const data: FormData = {
            age,
            expectedReturn: parseFloat(expectedReturnStr) || 0,
            taxBase: parseFloat(taxBaseStr) || 0,
            sumAssured,
            premium
            // เพิ่ม fields อื่นๆ ตาม FormData type
        };
        console.log("ResultPage: Successfully retrieved data:", data);
        return data;
    } else {
        console.error("ResultPage: Could not retrieve valid data (SA/Premium < Min) from sessionStorage.");
        return null; // คืนค่า null ถ้าข้อมูลสำคัญไม่ถูกต้อง
    }
  });

  // --- useEffect สำหรับคำนวณ (เหมือนเดิม แต่ใช้ formData จาก state) ---
  useEffect(() => {
    // คำนวณเมื่อ formData (จาก storage) พร้อม และ/หรือ includeTaxInIRR เปลี่ยน
    if (formData) {
      try {
        console.log(`ResultPage: Calculating results with includeTaxInIRR = ${includeTaxInIRR}`);
        const results = performCalculations(formData, includeTaxInIRR);
        setCalculationResults(results);
      } catch (error) {
        console.error("ResultPage: Calculation failed:", error);
        setCalculationResults(null);
      }
    } else {
      // ถ้า formData เป็น null (อ่านจาก storage ไม่ได้) ก็ไม่ต้องคำนวณ
      setCalculationResults(null);
    }
  }, [formData, includeTaxInIRR]); // ทำงานเมื่อ formData หรือ includeTaxInIRR เปลี่ยน

  // --- Function จัดการการกดปุ่มกลับ (เหมือนเดิม) ---
  const handleGoBack = () => {
    navigate('/'); // กลับไปหน้า Input
  };

  // --- ★★★ Redirect ถ้าไม่มีข้อมูล (เช็ค formData จาก state) ★★★ ---
  if (formData === null) {
    // Log นี้จะทำงานถ้า useState คืนค่า null ตอนเริ่มต้น
    console.error("ResultPage: formData state is null, redirecting...");
    return <Navigate to="/" replace />;
  }

  // --- Function จัดการ Class ของ Tab (เหมือนเดิม) ---
  const getTabClass = (tabName: 'table' | 'graph'): string => {
    // ... logic เดิม ...
    const baseClass = "py-2 px-4 rounded-t-lg cursor-pointer text-sm focus:outline-none";
    if (activeTab === tabName) {
      return `${baseClass} font-bold text-blue-700 -mb-px border-b-white bg-blue-50`;
    } else {
      return `${baseClass} font-medium text-gray-500 border-b-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50`;
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Header
        titleLine1="ผลประโยชน์แผนการเงิน"
        titleLine2="Global Index 16/6"
        line1Small={false}
      />
      {/* ปุ่มกลับ */}
      <div className="container mx-auto mt-4 px-4 flex justify-start mb-4">
        <button
          onClick={handleGoBack}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded shadow text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          เริ่มวางแผนใหม่
        </button>
      </div>
      {/* Container หลัก */}
      <div className="container mx-auto mt-6 px-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-400">
          <nav className="-mb-px flex space-x-[0.5px]" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('table')}
              className={`border border-gray-400 rounded-t px-4 py-2 mr-1 ${getTabClass('table')}`}
            >
              ตารางผลประโยชน์
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`border border-b-0 border-gray-400 rounded-t px-4 py-2 ${getTabClass('graph')}`}
            >
              กราฟ
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-1 bg-white px-8 pb-8 pt-4 rounded-lg shadow-md min-h-[300px]"> {/* เพิ่ม min-h */}
          {/* ★ แสดง Loading หรือ Content ขึ้นกับ calculationResults ★ */}
          {!calculationResults && <p className="text-center p-4">กำลังคำนวณ...</p>}

          {/* ใช้ && formData ด้วยเผื่อกรณี race condition เล็กน้อย */}
          {activeTab === 'table' && calculationResults && formData && (
            <ResultTable
              results={calculationResults}
              initialAge={formData.age} // ★ ใช้ formData จาก State ที่อ่านจาก Storage ★
              showTaxBenefitProp={includeTaxInIRR}
              onToggleTaxBenefit={() => setIncludeTaxInIRR(prev => !prev)}
            />
          )}
          {activeTab === 'graph' && calculationResults && formData && (
            <ResultChart results={calculationResults} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;