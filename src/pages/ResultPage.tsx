// --- ResultPage.tsx ---
import React, { useState, useEffect } from 'react'; // <<< เปลี่ยน useMemo เป็น useEffect
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ResultTable from '../components/ResultTable';
import ResultChart from '../components/ResultChart';
import { performCalculations } from '../utils/calculations'; // <<< ต้อง import ให้ถูก path
import { FormData, CalculationResults } from '../types';
import { FaArrowLeft } from 'react-icons/fa';

const ResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'table' | 'graph'>('table');

  // State จาก Navigation
  const formData = location.state?.formData as FormData | undefined;

  // *** เพิ่ม State ควบคุมการรวมภาษีใน IRR ***
  const [includeTaxInIRR, setIncludeTaxInIRR] = useState<boolean>(false); // เริ่มต้นแบบไม่รวม

  // *** เพิ่ม State เก็บผลการคำนวณ ***
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);

  // *** ใช้ useEffect คำนวณใหม่เมื่อ formData หรือ includeTaxInIRR เปลี่ยน ***
  useEffect(() => {
    if (formData) {
      try {
        console.log(`Calculating with includeTaxInIRR = ${includeTaxInIRR}`); // สำหรับ Debug
        // เรียก performCalculations พร้อมส่ง flag ตัวที่สอง
        const results = performCalculations(formData, includeTaxInIRR);
        setCalculationResults(results);
      } catch (error) {
        console.error("Calculation failed:", error);
        setCalculationResults(null); // จัดการ Error
      }
    } else {
      setCalculationResults(null);
    }
  }, [formData, includeTaxInIRR]); // <<< Dependency array

  // Function จัดการการกดปุ่มกลับ (เหมือนเดิม)
  const handleGoBack = () => {
    navigate('/');
  };

  // Redirect ถ้าไม่มีข้อมูล (เหมือนเดิม)
  if (!formData) { // <<< เช็คแค่ formData ก็พอ เพราะ results จะถูก set ใน useEffect
    console.error("ResultPage accessed without formData.");
    return <Navigate to="/" replace />;
  }

  // Function จัดการ Class ของ Tab (เหมือนเดิม)
  const getTabClass = (tabName: 'table' | 'graph'): string => {
    const baseClass = "py-2 px-4 rounded-t-lg cursor-pointer text-sm font-medium focus:outline-none";
    if (activeTab === tabName) {
      return `${baseClass} text-blue-700 border-b-2 border-blue-700 bg-blue-50`;
    } else {
      return `${baseClass} text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Header
        titleLine1="ผลประโยชน์แผนการเงิน"
        titleLine2="Global Index 16/6"
        line1Small={false}
      />
      {/* ปุ่มกลับ (เหมือนเดิม) */}
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
        {/* Tab Navigation (เหมือนเดิม) */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('table')}
              className={getTabClass('table')}
            >
              ตารางผลประโยชน์
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={getTabClass('graph')}
            >
              กราฟ
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {/* *** ตรวจสอบ calculationResults ก่อน Render *** */}
          {!calculationResults && <p>กำลังคำนวณ...</p>}

          {activeTab === 'table' && calculationResults && (
            <ResultTable
              results={calculationResults}
              initialAge={formData.age}
              // *** ส่ง Prop สำหรับควบคุมคอลัมน์ภาษี ***
              showTaxBenefitProp={includeTaxInIRR}
              onToggleTaxBenefit={() => setIncludeTaxInIRR(prev => !prev)} // ส่งฟังก์ชันสำหรับ Toggle
            />
          )}
          {activeTab === 'graph' && calculationResults && (
             // อาจจะต้องปรับ ResultChart ถ้ามันต้องใช้ข้อมูลที่เปลี่ยนตาม includeTaxInIRR ด้วย
            <ResultChart results={calculationResults} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;