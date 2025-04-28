// --- ResultTable.tsx ---
import React, { useState } from 'react';
import { CalculationResults } from '../types'; // สมมติว่า path ถูกต้อง
import { formatNumberWithCommas } from '../utils/formatters'; // สมมติว่า path ถูกต้อง
import { FaPlusCircle, FaMinusCircle } from 'react-icons/fa';

// Interface สำหรับ Props ของ Component
interface ResultTableProps {
  results: CalculationResults;
  initialAge: number;
  showTaxBenefitProp: boolean;   // Prop สำหรับแสดง/ซ่อนคอลัมน์ภาษี
  onToggleTaxBenefit: () => void; // Prop ฟังก์ชันสำหรับกดปุ่ม +/- ภาษี
}

// Base classes สำหรับ cell ต่างๆ (ตาม Strategy 3)
// th: เส้นซ้าย 1px
const thBaseClasses = "py-2 px-2 border-l border-black align-middle";
// td: เส้นซ้าย 1px, เส้นล่าง 1px (สำหรับ tbody)
const tdBaseClasses = "py-2 px-2 border-l border-b border-black align-middle";
// tfoot td: เส้นซ้าย 1px
const tfootTdBaseClasses = "py-2 px-2 border-l border-black align-middle";

const ResultTable: React.FC<ResultTableProps> = ({
  results,
  initialAge,
  showTaxBenefitProp,
  onToggleTaxBenefit,
}) => {
  // State ภายในสำหรับปุ่ม +/- อื่นๆ (คงไว้เหมือนเดิม)
  const [showAccumulatedCashback, setShowAccumulatedCashback] = useState(false);
  const [showSurrenderDetails, setShowSurrenderDetails] = useState(true);
  const [showDeathDetails, setShowDeathDetails] = useState(true);

  // Component ปุ่ม +/- (คงไว้เหมือนเดิม)
  const toggleButton = (isVisible: boolean, toggleFunc: () => void) => (
    <button onClick={toggleFunc} className="text-blue-700 hover:text-blue-900 ml-1 focus:outline-none align-middle">
      {isVisible ? <FaMinusCircle size="0.8em"/> : <FaPlusCircle size="0.8em"/>}
    </button>
  );

  // --- ส่วน JSX ที่แสดงผล ---
  return (
    <div className="overflow-x-auto shadow-md sm:rounded-s mt-6">
      {/* --- Table: กำหนดกรอบนอก 2px และ border-collapse --- */}
      <table className="w-full text-sm text-left text-gray-700 border-collapse border-2 border-black">

        {/* ----- THEAD: หัวตาราง ----- */}
        <thead className="text-base uppercase sticky top-0 z-10">

          {/* --- แถวที่ 1 ของ Header --- */}
          <tr className="text-black font-bold">
            {/* th ใช้ thBaseClasses + เพิ่ม border-b และ border-r (ยกเว้นอันสุดท้าย) */}
            <th scope="col" rowSpan={2} className={thBaseClasses + " w-[60px] text-center border-b border-r border-black"}>อายุ</th>
            <th scope="col" rowSpan={2} className={thBaseClasses + " w-[60px] text-center border-b border-r border-black"}>ปีที่</th>
            <th scope="col" rowSpan={2} className={thBaseClasses + " w-[110px] text-center border-b border-r border-black"}>
              เบี้ยประกัน {toggleButton(showTaxBenefitProp, onToggleTaxBenefit)}
            </th>
            {showTaxBenefitProp && (
              <th scope="col" rowSpan={2} className={thBaseClasses + " w-[110px] text-center border-b border-r border-black"}>
                ผลประโยชน์<br/>ทางภาษี
              </th>
            )}
            <th scope="col" rowSpan={2} className={thBaseClasses + " w-[110px] text-center border-b border-r border-black"}>
              เงินคืน {toggleButton(showAccumulatedCashback, () => setShowAccumulatedCashback(!showAccumulatedCashback))}
            </th>
            {showAccumulatedCashback && (
              <th scope="col" rowSpan={2} className={thBaseClasses + " w-[120px] text-center border-b border-r border-black"}>
                  เงินคืน<br/>สะสม
              </th>
            )}
            {/* กลุ่ม เวนคืน: มี border-r */}
            <th scope="col" colSpan={showSurrenderDetails ? 3 : 1} className={thBaseClasses + " text-center border-b border-r border-black"}>
              กรณีเวนคืน {toggleButton(showSurrenderDetails, () => setShowSurrenderDetails(!showSurrenderDetails))}
            </th>
            {/* กลุ่ม เสียชีวิต: อันสุดท้ายของแถว ไม่ต้องมี border-r */}
            <th scope="col" colSpan={showDeathDetails ? 3 : 1} className={thBaseClasses + " text-center border-b border-black"}> {/* ไม่มี border-r */}
              กรณีเสียชีวิต {toggleButton(showDeathDetails, () => setShowDeathDetails(!showDeathDetails))}
            </th>
          </tr>

          {/* --- แถวที่ 2 ของ Header (Sub-headers) --- */}
          {/* --- แถวนี้กำหนด border-b-2 เพื่อให้เส้นใต้ Header หนา 2px --- */}
          <tr className="text-sm text-black border-b-2 border-black">
            {/* th ใช้ thBaseClasses + เพิ่ม border-r (ยกเว้นอันสุดท้าย) */}
            {/* ไม่ต้องใส่ border-b ที่นี่ เพราะทั้งแถวกำหนด border-b-2 แล้ว */}
            {showSurrenderDetails && <th className={thBaseClasses + " w-[100px] text-center border-r border-black"}>เงินปันผล</th>}
            {showSurrenderDetails && <th className={thBaseClasses + " w-[100px] text-center border-r border-black"}>เงินเวนคืน</th>}
            <th className={thBaseClasses + " w-[120px] text-center border-r border-black"}>ผลประโยชน์รวม</th>

            {showDeathDetails && <th className={thBaseClasses + " w-[100px] text-center border-r border-black"}>เงินปันผล</th>}
            {showDeathDetails && <th className={thBaseClasses + " w-[100px] text-center border-r border-black"}>คุ้มครองชีวิต</th>}
            {/* อันสุดท้ายของแถว ไม่ต้องมี border-r */}
            <th className={thBaseClasses + " w-[120px] text-center border-black"}>ผลประโยชน์รวม</th>
          </tr>
        </thead>

        {/* ----- TBODY: เนื้อหาตาราง ----- */}
        <tbody>
          {results.yearlyData.map((row, index) => (
            <tr key={row.policyYear} className={`bg-gray-100 hover:bg-gray-50 even:bg-white ${row.policyYear === 16 ? 'font-bold' : ''}`}>
              {/* td ใช้ tdBaseClasses + เพิ่ม border-r (ยกเว้นอันสุดท้าย) */}
              <td className={tdBaseClasses + " text-center border-r border-black"}>{initialAge + index}</td>
              <td className={tdBaseClasses + " text-center border-r border-black"}>{row.policyYear}</td>
              <td className={tdBaseClasses + " text-right border-r border-black"}>{formatNumberWithCommas(Math.round(row.premium))}</td>
              {showTaxBenefitProp && <td className={tdBaseClasses + " text-right border-r border-black"}>{formatNumberWithCommas(Math.round(row.taxBenefit))}</td>}
              <td className={tdBaseClasses + " text-right border-r border-black"}>{formatNumberWithCommas(Math.round(row.cashback))}</td>
              {showAccumulatedCashback && <td className={tdBaseClasses + " text-right border-r border-black"}>{formatNumberWithCommas(Math.round(row.accumulatedCashback))}</td>}
              {showSurrenderDetails && <td className={tdBaseClasses + " text-right border-r border-black"}>{formatNumberWithCommas(Math.round(row.surrenderDividend))}</td>}
              {showSurrenderDetails && <td className={tdBaseClasses + " text-right border-r border-black"}>{formatNumberWithCommas(Math.round(row.surrenderValue))}</td>}
              <td className={tdBaseClasses + ` text-right ${row.policyYear !== 16 ? 'font-medium' : ''} border-r border-black`}>{formatNumberWithCommas(Math.round(row.totalSurrenderBenefit))}</td>
              {showDeathDetails && <td className={tdBaseClasses + " text-right border-r border-black"}>{formatNumberWithCommas(Math.round(row.deathDividend))}</td>}
              {showDeathDetails && <td className={tdBaseClasses + " text-right border-r border-black"}>{formatNumberWithCommas(Math.round(row.deathBenefit))}</td>}
              {/* คอลัมน์สุดท้ายของ tbody ไม่ต้องมี border-r */}
              <td className={tdBaseClasses + ` text-right ${row.policyYear !== 16 ? 'font-medium' : ''}`}>{formatNumberWithCommas(Math.round(row.totalDeathBenefit))}</td>
            </tr>
          ))}
        </tbody>

        {/* ----- TFOOT: ส่วนสรุปท้ายตาราง ----- */}
        <tfoot className="text-xs text-gray-800 font-semibold">
            {/* --- แถวสรุป กำหนด border-t-2 ให้เส้นบนหนา 2px --- */}
            <tr className="border-t-2 border-black text-sm font-bold">
                {/* td ใช้ tfootTdBaseClasses + เพิ่ม border-r (ยกเว้นอันสุดท้าย) */}
                <td colSpan={2} className={tfootTdBaseClasses + " text-center border-r border-black"}>รวม</td>
                <td className={tfootTdBaseClasses + " text-right text-red-600 border-r border-black"}>{formatNumberWithCommas(Math.round(results.totalPremium))}</td>
                {showTaxBenefitProp && <td className={tfootTdBaseClasses + " text-right text-red-600 border-r border-black"}>{formatNumberWithCommas(Math.round(results.totalTaxBenefit))}</td>}
                <td className={tfootTdBaseClasses + " text-right text-red-600 border-r border-black"}>{formatNumberWithCommas(Math.round(results.totalCashback))}</td>
                {showAccumulatedCashback && <td className={tfootTdBaseClasses + " border-r border-black"}></td>} {/* ช่องว่าง */}
                <td colSpan={showSurrenderDetails ? 3 : 1} className={tfootTdBaseClasses + " text-right text-red-600 border-r border-black"}>
                    IRR: {results.irrSurrender !== null ? `${results.irrSurrender.toFixed(2)}%` : 'N/A'}
                </td>
                {/* คอลัมน์สุดท้ายของ tfoot ไม่ต้องมี border-r */}
                <td colSpan={showDeathDetails ? 3 : 1} className={tfootTdBaseClasses + " text-right text-red-600"}>
                    IRR: {results.irrDeath !== null ? `${results.irrDeath.toFixed(2)}%` : 'N/A'}
                </td>
            </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ResultTable;