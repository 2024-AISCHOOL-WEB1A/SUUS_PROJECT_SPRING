import { Route, Routes, useLocation } from 'react-router-dom';
import "./App.css"
import Intro from './pages/Intro.jsx';
import Header from './components/header.jsx';
import Login from './pages/Login.jsx';
import Main from './pages/Main.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { usageActions } from './redux/reducer/usageSlice.js';
import { useEffect, useState } from 'react';
import instance from './axios.js';

function App() {
  const location = useLocation(); // 현재 경로 가져오기
  const shouldShowHeader = location.pathname !== '/' && location.pathname !== '/login'; // '/login' 경로에서는 Header 숨김
  const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
  const { isModalOpen, totalUsageTime } = useSelector((state) => state.usage)
  const [startTime, setStartTime] = useState(null) // 모달 열림 시간 기록
  const dispatch = useDispatch()

  // 모달 상태 변화 감지
  useEffect(() => {
    if (isModalOpen) {
      // 모달이 열리면 현재 시간 기록
      setStartTime(Date.now());
    } else if (startTime) {
      // 모달이 닫히면 사용 시간 계산 및 Redux에 추가
      const timeSpent = Math.floor((Date.now() - startTime) / 1000); // 초 단위 계산
      dispatch(usageActions.addUsageTime(timeSpent));
      setStartTime(null); // 초기화
    }
  }, [isModalOpen, startTime, dispatch]);

  // 일정 시간마다 서버로 동기화
  useEffect(() => {
    const interval = setInterval(async () => {
      if (totalUsageTime > 0) {
        const reqUsageData = {usageTime: totalUsageTime, companyId: userInfo.companyId}
        try {
          await instance.post("/UpdateUsageTime", reqUsageData);
          dispatch(usageActions.addUsageTime(-totalUsageTime)); // 전송 후 초기화
        } catch (error) {
          console.error("Failed to sync usage time:", error.response.data);
        }
      }
    }, 600000); // 60초마다 실행

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 타이머 정리
  }, [totalUsageTime, dispatch]);

  return (
    <div>
      {shouldShowHeader && <Header />}
      <Routes>
        <Route path='/' element={<Intro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/main" element={<Main />} />
      </Routes>
    </div>
  );
}

export default App;
