import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Header from '../components/header'
import '../css/Intro.css'

const Intro = () => {
    const nav = useNavigate();
    const [showButton, setShowButton] = useState(false); // 버튼 표시 여부 상태 관리

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".wrapper",
                end: "+=100%",
                pin: true,
                scrub: 0.5, // 스크럽 속도 조정
                markers: false, // 마커를 숨김
                onLeave: () => setShowButton(true),        // 스크롤이 끝까지 가면 버튼 표시
                onEnterBack: () => setShowButton(false)     // 스크롤이 다시 위로 돌아오면 버튼 숨김
            }
        })
            .to("img", {
                scale: 2.0,
                z: 350,
                transformOrigin: "center center",
                ease: "power1.inOut"
            });

            return () => {
                if (tl) tl.kill();
                ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            };
    }, []);

    const handleArrowClick = () => {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        gsap.globalTimeline.clear();

        nav('/login');
    };

    return (
        <div className="wrapper">
            <div className="content">
                <div className="image-container">
                    <img src="/imgs/endImg.png"/>
                </div>

                <Header/>
                <div className="section">
                    <div className='overlay-img'>
                        <img src="./imgs/2650149.png"/>
                    </div>
                </div>
            </div>
            {/* 스크롤이 끝까지 진행되면 버튼이 표시됨 */}
            {showButton && (
                <button onClick={handleArrowClick} className="scroll-end-button">
                    Go to Login
                </button>
            )}
        </div>
    );
}

export default Intro;
