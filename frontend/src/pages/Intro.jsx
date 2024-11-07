import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Intro.css';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Header from '../components/header';

const Main = () => {
    const navigate = useNavigate();

    useEffect(() => {
        gsap.registerPlugin(ScrollToPlugin);

        // 이미지 자동 확대 애니메이션
        gsap.to("img", {
            scale: 2,
            z: 350,
            transformOrigin: "center center",
            ease: "power1.inOut",
            duration: 3 // 애니메이션 지속 시간 조정
        });

        gsap.to(".overlay-img", {
            scale: 0.2,
            transformOrigin: "center center",
            ease: "power1.inOut",
            duration: 3 // 애니메이션 지속 시간 조정
        });
    }, []);

    const handleArrowClick = () => {
        console.log("Arrow clicked!");
        navigate('/login');
    };

    return (
        <div>
            <div className="wrapper">
                <div className="content">
                    <Header />
                    <section className="section hero">
                        <div className='overlay-img'>
                            <img src="./imgs/2650149.png" alt="" />
                        </div>
                      
                    </section>
                    <div className="image-container">
                        <img src="./imgs/endImg.png" alt="image" />
                        <div className="arrow-container" onClick={handleArrowClick}>
                            <p>Go To Login</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Main;
