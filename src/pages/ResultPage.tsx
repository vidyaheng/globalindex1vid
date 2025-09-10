import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // ตรวจสอบ path
import ResultTable from '../components/ResultTable'; // ตรวจสอบ path
import ResultChart from '../components/ResultChart'; // ตรวจสอบ path
import { performCalculations } from '../utils/calculations'; // ตรวจสอบ path
import { FormData, CalculationResults } from '../types'; // ตรวจสอบ path
import { FaArrowLeft } from 'react-icons/fa';
import { exportToPdf } from '../utils/pdfExporter'; // ★ 1. Import ฟังก์ชัน Export

// --- ค่าคงที่และ Helper Function (เหมือนเดิม) ---
const SESSION_STORAGE_PREFIX = 'InputPage_';
const MIN_SUM_ASSURED_FOR_RESULT = 20000;

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
    const [isExporting, setIsExporting] = useState<boolean>(false); // ★ 2. เพิ่ม State สำหรับจัดการ Loading

    const [formData] = useState<FormData | null>(() => {
        // ... (โค้ดส่วนนี้เหมือนเดิม) ...
        const age = getStateFromSessionStorage('age', 0, true);
        const expectedReturnStr = getStateFromSessionStorage('expectedReturn', '0');
        const taxBaseStr = getStateFromSessionStorage('taxBase', '0');
        const sumAssured = getStateFromSessionStorage('sumAssured', 0, true);
        const premium = getStateFromSessionStorage('premium', 0, true);
        if (sumAssured >= MIN_SUM_ASSURED_FOR_RESULT || premium >= 20000) {
            const data: FormData = { age, expectedReturn: parseFloat(expectedReturnStr) || 0, taxBase: parseFloat(taxBaseStr) || 0, sumAssured, premium };
            return data;
        }
        return null;
    });

    useEffect(() => {
        // ... (โค้ดส่วนนี้เหมือนเดิม) ...
        if (formData) {
            try {
                const results = performCalculations(formData, includeTaxInIRR);
                setCalculationResults(results);
            } catch (error) {
                console.error("ResultPage: Calculation failed:", error);
                setCalculationResults(null);
            }
        } else {
            setCalculationResults(null);
        }
    }, [formData, includeTaxInIRR]);

    const handleGoBack = () => {
        navigate('/');
    };

    // ★ 3. แก้ไขฟังก์ชัน HandleClick ให้เป็น async และจัดการ Loading
    const handleExportClick = async () => {
        if (isExporting) return; // ป้องกันการกดซ้ำซ้อน

        console.log("1. กดปุ่ม Export PDF แล้ว!");
        console.log("2. ตรวจสอบข้อมูล ณ เวลาที่กด:", { formData, calculationResults });

        if (calculationResults && formData) {
            setIsExporting(true); // เริ่มแสดง Loading
            try {
                console.log("3. ข้อมูลพร้อมแล้ว, กำลังเรียกใช้ exportToPdf...");
                await exportToPdf(formData, calculationResults, includeTaxInIRR); // รอให้การสร้าง PDF เสร็จสิ้น
                console.log("4. สร้าง PDF สำเร็จ!");
            } catch (error) {
                // Error จะถูกจัดการภายใน exportToPdf (แสดง alert) อยู่แล้ว
                console.error("4. เกิดข้อผิดพลาดระหว่างการสร้าง PDF:", error);
            } finally {
                setIsExporting(false); // หยุดแสดง Loading เสมอ
            }
        } else {
            console.log("3. ข้อมูลไม่พร้อมสำหรับการ Export!");
            alert("ไม่สามารถสร้าง PDF ได้เนื่องจากข้อมูลไม่พร้อม");
        }
    };


    if (formData === null) {
        return <Navigate to="/" replace />;
    }
    
    const getTabClass = (tabName: 'table' | 'graph'): string => {
        const baseClass = "py-2 px-4 rounded-t-lg cursor-pointer text-sm focus:outline-none";
        if (activeTab === tabName) {
            return `${baseClass} font-bold text-blue-700 -mb-px border-b-white bg-blue-50`;
        } else {
            return `${baseClass} font-medium text-gray-500 border-b-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50`;
        }
    };


    return (
        <div className="min-h-screen bg-gray-100 pb-10">
            <Header
                titleLine1="ผลประโยชน์แผนการเงิน"
                titleLine2="Global Index 16/6"
                line1Small={false}
            />

            {/* Container สำหรับปุ่มต่างๆ */}
            <div className="container mx-auto mt-4 px-4 flex justify-between items-center mb-4">
                <button
                    onClick={handleGoBack}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded shadow text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                >
                    <FaArrowLeft className="mr-2 h-4 w-4" />
                    เริ่มวางแผนใหม่
                </button>

                {/* ★ 4. แก้ไขปุ่ม Export ให้รองรับ Loading State ★ */}
                <button
                    onClick={handleExportClick}
                    disabled={isExporting}
                    className="flex items-center px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg shadow text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {isExporting ? 'กำลังสร้าง PDF...' : 'Export เป็น PDF'}
                </button>
            </div>

            {/* Container หลัก (เหมือนเดิม) */}
            <div className="container mx-auto mt-6 px-4">
                <div className="border-b border-gray-400">
                    <nav className="-mb-px flex space-x-[0.5px]" aria-label="Tabs">
                        <button onClick={() => setActiveTab('table')} className={`border border-gray-400 rounded-t px-4 py-2 mr-1 ${getTabClass('table')}`}>
                            ตารางผลประโยชน์
                        </button>
                        <button onClick={() => setActiveTab('graph')} className={`border border-b-0 border-gray-400 rounded-t px-4 py-2 ${getTabClass('graph')}`}>
                            กราฟ
                        </button>
                    </nav>
                </div>
                <div className="mt-1 bg-white px-8 pb-8 pt-4 rounded-lg shadow-md min-h-[300px]">
                    {!calculationResults && <p className="text-center p-4">กำลังคำนวณ...</p>}
                    {activeTab === 'table' && calculationResults && formData && (
                        <ResultTable
                            results={calculationResults}
                            initialAge={formData.age}
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
