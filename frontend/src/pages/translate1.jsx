// Translate.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../css/translate1.css';
import { TweenMax, Power4 } from 'gsap';
import Pay from '../components/pay';
// import Suus from '../components/Translate';
// import MyPage from '../components/mypage'; // 확장자 추가
 // 마이페이지 컴포넌트 임포트

const animations = ['수어번역', '마이페이지', '로그아웃'];

const Translate = () => {
    const [view, setView] = useState('수어번역');
    const [activeColor, setActiveColor] = useState('');
    const [showPay, setShowPay] = useState(false);
    const navigate = useNavigate();

    const handleAnimationClick = (animation, color) => {
        setView(animation);
        setActiveColor(color);

        if (animation === '로그아웃') {
            navigate('/login'); // 로그아웃 시 로그인 페이지로 이동
        }
    };

    return (
        <div id="app">
            {/* <TransitionComponent view={view} /> */}
            <Controls
                animations={animations}
                onAnimationClick={handleAnimationClick}
                activeView={view}
                activeColor={activeColor}
            />
            {/* {view === '수어번역' && <Suus />} */}
            {/* {view === '마이페이지' && <MyPage/>} 마이페이지 컴포넌트 표시 */}
        
        </div>
    );
};

const Controls = ({ animations, onAnimationClick, activeView }) => {
    const colors = [
        'var(--color1)',
        'var(--color2)',
        'var(--color3)',
        'var(--color4)',
        'var(--color5)'
    ];

    return (
        <ul className="controls">
            {animations.map((animation, index) => (
                <li
                    key={animation}
                    onClick={() => onAnimationClick(animation, colors[index])}
                    className={animation === activeView ? 'active' : ''}
                    style={{
                        backgroundColor: animation === activeView ? colors[index] : 'transparent',
                        color: animation === activeView ? '#fff' : '#000000',
                        fontWeight: 'bold'
                    }}
                >
                    {animation}
                </li>
            ))}
        </ul>
    );
};

const TransitionComponent = ({ view }) => {
    const enter = (el) => {
        TweenMax.fromTo(el, 1, {
            autoAlpha: 0,
            scale: 1.5,
        }, {
            autoAlpha: 1,
            scale: 1,
            transformOrigin: '50% 50%',
            ease: Power4.easeOut
        });
    };

    const leave = (el) => {
        TweenMax.fromTo(el, 1, {
            autoAlpha: 1,
            scale: 1,
        }, {
            autoAlpha: 0,
            scale: 0.8,
            ease: Power4.easeOut
        });
    };

    return (
        <div className={`page ${view}`} onMouseEnter={enter} onMouseLeave={leave}>
            <div className="center">
                {/* <h1 style={{ cursor: 'pointer' }}>{view}</h1> */}
            </div>
            <div>
            </div>
        </div>
    );
};

export default Translate;
