import React from 'react'
import Translate from './Translate'
import Controls from '../components/Controls'
import '../css/Main.css'
import Mypage from './Mypage'
import { useSelector } from 'react-redux'

const Main = () => {
    const {currentView} = useSelector(state => state.control)
    
    return (
        <div style={{height: '100vh'}}>
            {currentView === "수어번역" && <Translate />}
            {currentView === "마이페이지" &&<Mypage/>}
            <Controls />
            
        </div>
    )
}

export default Main