import React, { useRef, useEffect } from 'react';
import '../css/Translate.css';
import instance from '../axios';
import { useDispatch, useSelector } from "react-redux";
import { usageActions } from '../redux/reducer/usageSlice';
import { TweenMax, Expo, Back } from 'gsap';

const Translate = () => {
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((state) => state.usage);

  const openModal = () => {
    dispatch(usageActions.openModal());
  };

  const modalClose = async () => {
    dispatch(usageActions.closeModal());
    try {
      const res = await instance.get("http://localhost:5000/shutdown");
      console.log(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className='backgroundImg'>
      <img src='./imgs/blur-hospital.jpg' alt="Background" className="backgroundImage" />
      <span className="button-text" onClick={openModal}>START</span>
      <div className="gif-container">
        <img src='./imgs/--unscreen.gif' alt="Avatar" className='gif-animation' />
        <div className="gif-overlay">수어번역을 하기 위해서 버튼을 눌러주세요</div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <iframe src="http://localhost:5000/video_feed" width={1280} height={720}></iframe>
              <span className="close" onClick={modalClose}>&times;</span>
            </div>
            <div className="modal-body"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translate;
