import React, { useState } from 'react'
import UsageChart from '../components/UsageChart';
import "../css/Mypage.css"
import UserInfo from '../components/UserInfo';

const Mypage = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
    console.log(userInfo)
    const [activeButton, setActiveButton] = useState('이용량');

    const handleButtonClick = (button) => {
        setActiveButton(button);
        console.log(`${button} 버튼이 클릭되었습니다`);
    };

    const renderCardContent = () => {
        switch (activeButton) {
            case '이용량':
                return <UsageChart userInfo={userInfo}/>;
            case '결제정보':
                return <div>결제 정보를 여기에 표시합니다.</div>;
            case '회원정보':
                return <UserInfo userInfo={userInfo}/>
            default:
                return <div>내용이 없습니다.</div>;
        }
    };

    return (
        <div className="dashboard-wrapper">
            <aside className="sidebar">
                <div className="profile">
                    <h3>{userInfo.userName}</h3>
                </div>
                <button className={`upgrade-btn ${activeButton === '이용량' ? 'active' : ''}`}
                    onClick={() => handleButtonClick('이용량')} >
                    이용량
                </button>
                <button className={`upgrade-btn ${activeButton === '결제정보' ? 'active' : ''}`}
                    onClick={() => handleButtonClick('결제정보')} >
                    결제정보
                </button>
                <button className={`upgrade-btn ${activeButton === '회원정보' ? 'active' : ''}`}
                    onClick={() => handleButtonClick('회원정보')} >
                    회원정보
                </button>
            </aside>

            <main className="content-my">
                <div className="card">
                    {renderCardContent()}
                </div>
            </main>
        </div>
    )
}

export default Mypage