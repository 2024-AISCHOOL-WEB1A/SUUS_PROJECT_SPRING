import React, { useState } from 'react';
import '../css/Translate.css';
import instance from '../axios';

const Translate = () => {

  const [isModalOpen, setIsModalOpen] = useState(false); // 모달창 상태 관리

  const modalClose = async () => {
    setIsModalOpen(false)
    try{
      const res = await instance.get("http://localhost:5000/shutdown")
      console.log(res.data)
    }
    catch (e) {
      console.error(e)
    }
  }

  return (
    <div className='backgroundImg'>
      <button className={'round'} onClick={() => setIsModalOpen(true)}>
        <span className="button-text">Start</span>
      </button>
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            {/* 상단 부분 */}
            <div className="modal-header">
              <iframe src={isModalOpen?"http://localhost:5000/video_feed":""} width={1280} height={720}></iframe>
              <span className="close" onClick={modalClose}>&times;</span>
            </div>
            {/* 하단 부분 */}
            <div className="modal-body">
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default Translate;
