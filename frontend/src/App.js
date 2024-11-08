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
  const location = useLocation();
  const shouldShowHeader = location.pathname !== '/' && location.pathname !== '/login';
  const { isModalOpen, totalUsageTime } = useSelector((state) => state.usage);
  const [userInfo, setUserInfo] = useState(() => JSON.parse(localStorage.getItem("userInfo")) || {}); // 초기 상태로 로컬 스토리지 값 가져오기
  const [startTime, setStartTime] = useState(null);
  const dispatch = useDispatch();

  // 모달 상태 변화 감지
  useEffect(() => {
    if (userInfo && Object.keys(userInfo).length > 0 && isModalOpen) {
      setStartTime(Date.now());
    } else if (startTime && userInfo && Object.keys(userInfo).length > 0) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      dispatch(usageActions.addUsageTime(timeSpent));
      setStartTime(null);
    }
  }, [isModalOpen, startTime, dispatch, userInfo]);

  // 일정 시간마다 서버로 동기화
  useEffect(() => {
    if (userInfo && Object.keys(userInfo).length > 0) {
      const interval = setInterval(async () => {
        if (totalUsageTime > 0) {
          console.log(totalUsageTime)
          const reqUsageData = { usageTime: totalUsageTime, companyId: userInfo.companyId };
          try {
            await instance.post("/UpdateUsageTime", reqUsageData);
            dispatch(usageActions.addUsageTime(-totalUsageTime));
          } catch (error) {
            console.error("Failed to sync usage time:", error.response?.data || error.message);
          }
        }
      }, 3600000); // 10분 간격으로 실행

      return () => clearInterval(interval);
    }
  }, [totalUsageTime, dispatch, userInfo]);

  return (
    <div>
      {shouldShowHeader && <Header />}
      <Routes>
        <Route path='/' element={<Intro />} />
        <Route path="/login" element={<Login setUserInfo={setUserInfo} />} />
        <Route path="/main" element={<Main />} />
      </Routes>
    </div>
  );
}

export default App;