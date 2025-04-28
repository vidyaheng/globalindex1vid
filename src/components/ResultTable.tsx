// --- ResultTable.tsx ---
import React, { useState } from 'react'; // <<< อาจจะไม่ต้องการ useState ถ้า state อื่นๆ ไม่ได้ใช้แล้ว หรือย้ายไป Parent หมด
import { CalculationResults } from '../types';
import { formatNumberWithCommas } from '../utils/formatters';
import { FaPlusCircle, FaMinusCircle } from 'react-icons/fa';

// *** Interface Props ที่แก้ไขแล้ว ***
interface ResultTableProps {
  results: CalculationResults;
  initialAge: number;
  showTaxBenefitProp: boolean;      // <-- Prop: สถานะการแสดงคอลัมน์ภาษี
  onToggleTaxBenefit: () => void; // <-- Prop: ฟังก์ชันที่จะเรียกเมื่อกดปุ่ม +/- ภาษี
  // อาจจะมี props อื่นๆ สำหรับ state อื่นๆ ถ้าต้องการย้ายจาก Parent มาด้วย
}

// Base classes for cells (เหมือนเดิม)
const thBaseClasses = "py-2 px-2 border-l border-b border-gray-800 align-middle";
const tdBaseClasses = "py-2 px-2 border-l border-b border-blue-800 align-middle";
const tfootTdBaseClasses = "py-2 px-2 border-l border-blue-800 align-middle";


const ResultTable: React.FC<ResultTableProps> = ({
  results,
  initialAge,
  showTaxBenefitProp,   // <-- ใช้ Prop
  onToggleTaxBenefit, // <-- ใช้ Prop
  // ...other props
}) => {
  // --- ลบ State นี้ออก ---
  // const [showTaxBenefit, setShowTaxBenefit] = useState(false);

  // --- State อื่นๆ ยังคงไว้ตามเดิม (ถ้าไม่กระทบการคำนวณ IRR) ---
  const [showAccumulatedCashback, setShowAccumulatedCashback] = useState(false);
  const [showSurrenderDetails, setShowSurrenderDetails] = useState(true);
  const [showDeathDetails, setShowDeathDetails] = useState(true);

  // Button component (เหมือนเดิม)
  const toggleButton = (isVisible: boolean, toggleFunc: () => void) => (
    <button onClick={toggleFunc} className="text-blue-700 hover:text-blue-900 ml-1 focus:outline-none align-middle">
      {isVisible ? <FaMinusCircle size="0.8em"/> : <FaPlusCircle size="0.8em"/>}
    </button>
  );

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-s mt-6 border-t-[3px] border-l border-r border-b border-blue-900">
      <table className="w-full text-sm text-left text-gray-700 border-collapse">
        {/* ----- THEAD ----- */}
        <thead className="text-lg uppercase sticky top-0 z-10">
          {/* --- แถวที่ 1 --- */}
          <tr className="bg-blue-200 text-black font-bold">
            {/* ... th อายุ, ปีที่ ... */}
             <th scope="col" rowSpan={2} className={thBaseClasses + " w-[60px] text-center"}>อายุ</th>
             <th scope="col" rowSpan={2} className={thBaseClasses + " w-[60px] text-center"}>ปีที่</th>
            <th scope="col" rowSpan={2} className={thBaseClasses + " w-[110px] text-center"}>
              {/* *** ใช้ Prop ที่รับมาสำหรับปุ่ม Tax Benefit *** */}
              เบี้ยประกัน {toggleButton(showTaxBenefitProp, onToggleTaxBenefit)}
            </th>
            {/* *** ใช้ Prop ที่รับมาสำหรับแสดงคอลัมน์ Tax Benefit *** */}
            {showTaxBenefitProp && (
              <th scope="col" rowSpan={2} className={thBaseClasses + " w-[110px] text-center"}>
                ผลประโยชน์<br/>ทางภาษี
              </th>
            )}
             {/* ... th เงินคืน, สะสม, เวนคืน, เสียชีวิต (ใช้ State ภายในเหมือนเดิม) ... */}
             <th scope="col" rowSpan={2} className={thBaseClasses + " w-[110px] text-center"}>
                เงินคืน {toggleButton(showAccumulatedCashback, () => setShowAccumulatedCashback(!showAccumulatedCashback))}
             </th>
             {showAccumulatedCashback && (
                <th scope="col" rowSpan={2} className={thBaseClasses + " w-[120px] text-center"}>
                   เงินคืน<br/>สะสม
                </th>
             )}
             <th scope="col" colSpan={showSurrenderDetails ? 3 : 1} className={thBaseClasses + " text-center"}>
                กรณีเวนคืน {toggleButton(showSurrenderDetails, () => setShowSurrenderDetails(!showSurrenderDetails))}
             </th>
             <th scope="col" colSpan={showDeathDetails ? 3 : 1} className={thBaseClasses + " border-r text-center"}>
                กรณีเสียชีวิต {toggleButton(showDeathDetails, () => setShowDeathDetails(!showDeathDetails))}
             </th>
          </tr>
          {/* --- แถวที่ 2 (Sub-headers) --- */}
          <tr className="text-base text-black border-b-[3px] border-blue-900 bg-blue-200">
                {/* ... Sub-headers เหมือนเดิม ... */}
                {showSurrenderDetails && <th className={thBaseClasses + " border-b border-white w-[100px] text-center"}>เงินปันผล</th>}
                {showSurrenderDetails && <th className={thBaseClasses + " border-b border-white w-[100px] text-center"}>เงินเวนคืน</th>}
                <th className={thBaseClasses + " border-b border-white w-[120px] text-center"}>ผลประโยชน์รวม</th>
                {showDeathDetails && <th className={thBaseClasses + " border-b border-white w-[100px] text-center"}>เงินปันผล</th>}
                {showDeathDetails && <th className={thBaseClasses + " border-b border-white w-[100px] text-center"}>คุ้มครองชีวิต</th>}
                <th className={thBaseClasses + " border-b border-r border-white w-[120px] text-center"}>ผลประโยชน์รวม</th>
          </tr>
        </thead>
        {/* ----- TBODY ----- */}
        <tbody>
          {results.yearlyData.map((row, index) => (
            <tr key={row.policyYear} className={`bg-white hover:bg-gray-50 even:bg-gray-100 ${row.policyYear === 16 ? 'font-bold' : ''}`}>
               <td className={tdBaseClasses + " text-center"}>{initialAge + index}</td>
               <td className={tdBaseClasses + " text-center"}>{row.policyYear}</td>
               <td className={tdBaseClasses + " text-right"}>{formatNumberWithCommas(Math.round(row.premium))}</td>
              {/* *** ใช้ Prop ที่รับมาสำหรับแสดงข้อมูล Tax Benefit *** */}
              {showTaxBenefitProp && <td className={tdBaseClasses + " text-right"}>{formatNumberWithCommas(Math.round(row.taxBenefit))}</td>}
              {/* ... td อื่นๆ เหมือนเดิม ... */}
              <td className={tdBaseClasses + " text-right"}>{formatNumberWithCommas(Math.round(row.cashback))}</td>
              {showAccumulatedCashback && <td className={tdBaseClasses + " text-right"}>{formatNumberWithCommas(Math.round(row.accumulatedCashback))}</td>}
              {showSurrenderDetails && <td className={tdBaseClasses + " text-right"}>{formatNumberWithCommas(Math.round(row.surrenderDividend))}</td>}
              {showSurrenderDetails && <td className={tdBaseClasses + " text-right"}>{formatNumberWithCommas(Math.round(row.surrenderValue))}</td>}
              <td className={tdBaseClasses + ` text-right ${row.policyYear !== 16 ? 'font-medium' : ''}`}>{formatNumberWithCommas(Math.round(row.totalSurrenderBenefit))}</td>
              {showDeathDetails && <td className={tdBaseClasses + " text-right"}>{formatNumberWithCommas(Math.round(row.deathDividend))}</td>}
              {showDeathDetails && <td className={tdBaseClasses + " text-right"}>{formatNumberWithCommas(Math.round(row.deathBenefit))}</td>}
              <td className={tdBaseClasses + " border-r" + ` text-right ${row.policyYear !== 16 ? 'font-medium' : ''}`}>{formatNumberWithCommas(Math.round(row.totalDeathBenefit))}</td>
            </tr>
          ))}
        </tbody>
        {/* ----- TFOOT ----- */}
        <tfoot className="text-xs text-gray-800 bg-blue-200 font-semibold">
            <tr className="border-t-2 border-b-[3px] border-blue-900 text-sm font-bold">
               <td colSpan={2} className={tfootTdBaseClasses + " text-center"}>รวม</td>
               <td className={tfootTdBaseClasses + " text-right text-red-600"}>{formatNumberWithCommas(Math.round(results.totalPremium))}</td>
              {/* *** ใช้ Prop ที่รับมาสำหรับแสดงผลรวม Tax Benefit *** */}
              {showTaxBenefitProp && <td className={tfootTdBaseClasses + " text-right text-red-600"}>{formatNumberWithCommas(Math.round(results.totalTaxBenefit))}</td>}
              {/* ... td รวมเงินคืน, ช่องว่าง ... */}
               <td className={tfootTdBaseClasses + " text-right text-red-600"}>{formatNumberWithCommas(Math.round(results.totalCashback))}</td>
              {showAccumulatedCashback && <td className={tfootTdBaseClasses}></td>}
              {/* *** แสดง IRR จาก results ที่รับมา (ตอนนี้จะเปลี่ยนตามการกดปุ่มแล้ว) *** */}
              <td colSpan={showSurrenderDetails ? 3 : 1} className={tfootTdBaseClasses + " text-right text-red-600"}>
                  IRR: {results.irrSurrender !== null ? `${results.irrSurrender.toFixed(2)}%` : 'N/A'}
              </td>
              <td colSpan={showDeathDetails ? 3 : 1} className={tfootTdBaseClasses + " border-r" + " text-right text-red-600"}>
                  IRR: {results.irrDeath !== null ? `${results.irrDeath.toFixed(2)}%` : 'N/A'}
              </td>
            </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ResultTable;
