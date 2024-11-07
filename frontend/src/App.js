import { Route, Routes, useLocation } from 'react-router-dom';
import "./App.css"
import Intro from './pages/Intro.jsx';
import Header from './components/header.jsx';
import Login from './pages/Login.jsx';
import Main from './pages/Main.jsx';
import Tran from './pages/translate1.jsx'


function App() {
  const location = useLocation(); // 현재 경로 가져오기
  const shouldShowHeader = location.pathname !== '/' && location.pathname !== '/login'; // '/login' 경로에서는 Header 숨김
  return (
      <div>
        { shouldShowHeader && <Header />}
        <Routes>
          <Route path='/' element={<Intro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/main" element={<Main />} />
          
          {/* <Route path="/tran" element={<Tran />} /> */}

        </Routes>
      </div>
  );
}

export default App;
