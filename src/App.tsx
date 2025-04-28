import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InputPage from './pages/InputPage'; // เราจะสร้างไฟล์นี้ต่อไป
import ResultPage from './pages/ResultPage'; // เราจะสร้างไฟล์นี้ต่อไป
import './index.css'; // ยังคง import CSS หลักไว้

function App() {
  return (
    <Router>
      {/* ไม่ต้องมี div ครอบตรงนี้ก็ได้ ถ้า body ใน index.css จัดการพื้นหลังแล้ว */}
      <Routes>
        {/* กำหนดว่า path "/" (หน้าแรก) ให้แสดง Component InputPage */}
        <Route path="/" element={<InputPage />} />

        {/* กำหนดว่า path "/result" ให้แสดง Component ResultPage */}
        <Route path="/result" element={<ResultPage />} />

        {/* เพิ่ม Route อื่นๆ ที่นี่ถ้ามี */}
      </Routes>
    </Router>
  );
}

export default App;