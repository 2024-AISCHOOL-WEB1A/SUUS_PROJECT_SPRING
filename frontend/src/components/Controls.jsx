import React from 'react'
import "../css/Controls.css"
import { useNavigate } from 'react-router-dom';
import { controlActions } from "../redux/reducer/controlSlice"
import {useSelector, useDispatch } from "react-redux"

const Controls = () => {
    const animations = ['수어번역', '마이페이지', '로그아웃']
    const colors = ['var(--color1)', 'var(--color2)']

    const {currentView} = useSelector(state => state.control)
    const dispatch = useDispatch()
    const nav = useNavigate();

    const handleAnimationClick = (type) => {
        if (type === '로그아웃') {
            if(window.confirm("로그아웃 하시겠습니까?")){
                localStorage.removeItem("userInfo");
                nav('/login');
            } 
        } else {
            dispatch(controlActions.changeView(type))
        }
    };

    return (
        <div>
            <ul className="controls">
                {animations.map((item, index) => (
                    <li key={index} onClick={() => handleAnimationClick(item)}
                    className={item === currentView ? 'active' : ''} 
                    style={{backgroundColor: item === currentView ? colors[index] : 'transparent',
                        color: item === currentView ? '#fff' : '#000000', fontWeight: 'bold' }}> 
                        {item} 
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Controls