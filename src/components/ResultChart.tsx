import React from 'react';
import { CalculationResults } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatNumberWithCommas } from '../utils/formatters';

interface ResultChartProps {
  results: CalculationResults;
}

// Formatter for Tooltip and Y-Axis
const formatAxisNumber = (tickItem: number) => {
    if (tickItem >= 1000000) {
        return `${(tickItem / 1000000).toFixed(1)}M`;
    }
    if (tickItem >= 1000) {
         return `${(tickItem / 1000).toFixed(0)}K`;
    }
    return tickItem.toString();
}

const ResultChart: React.FC<ResultChartProps> = ({ results }) => {
  // Prepare data for the chart
  let cumulativePremium = 0;
  const chartData = results.yearlyData.map(yearData => {
    cumulativePremium += yearData.premium;
    return {
      year: yearData.policyYear,
      'เบี้ยประกันสะสม': cumulativePremium,
      'ผลประโยชน์รวม (เวนคืน)': yearData.totalSurrenderBenefit,
      'ผลประโยชน์รวม (เสียชีวิต)': yearData.totalDeathBenefit,
    };
  });

  return (
    <div className="mt-8 p-4 bg-white rounded shadow-lg" style={{ width: '100%', height: 700 }}>
       <h4 className="text-lg font-semibold mb-4 text-center text-gray-700">กราฟเปรียบเทียบผลประโยชน์</h4>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 20, right: 100, left: 50, bottom: 100,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" label={{ value: "ปีที่", position: "insideBottomRight", dy: -5, dx: 80 }} />
          <YAxis tickFormatter={formatAxisNumber} label={{ value: "จำนวนเงิน (บาท)", angle: 0, position: 'top', dx: 0, dy: -30 }} />
          <Tooltip formatter={(value: number) => formatNumberWithCommas(value)} />
          <Legend verticalAlign="top" height={36}/>
          <Line type="monotone" dataKey="เบี้ยประกันสะสม" stroke="#ff7300" activeDot={{ r: 8 }} name="เบี้ยประกันสะสม"/>
          <Line type="monotone" dataKey="ผลประโยชน์รวม (เวนคืน)" stroke="#387908" name="ผลประโยชน์รวม (เวนคืน)" />
          <Line type="monotone" dataKey="ผลประโยชน์รวม (เสียชีวิต)" stroke="#8884d8" name="ผลประโยชน์รวม (เสียชีวิต)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultChart;