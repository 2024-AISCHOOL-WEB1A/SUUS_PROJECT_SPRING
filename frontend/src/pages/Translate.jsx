import React, { useRef, useEffect } from 'react';
import '../css/Translate.css';
import instance from '../axios';
import { useDispatch, useSelector } from "react-redux"
import { usageActions } from '../redux/reducer/usageSlice';
import { TweenMax, Expo, Back } from 'gsap';

const Translate = () => {
  const buttonRef = useRef(null); // 버튼 참조
  const dispatch = useDispatch()
  const { isModalOpen } = useSelector((state) => state.usage)

  // 버튼 애니메이션 효과 적용
  useEffect(() => {
    const $button = buttonRef.current;
    if ($button) {
      $button.addEventListener('click', () => {
        const duration = 0.3;
        const delay = 0.08;
        TweenMax.to($button, duration, { scaleY: 1.6, ease: Expo.easeOut });
        TweenMax.to($button, duration, { scaleX: 1.2, scaleY: 1, ease: Back.easeOut, easeParams: [3], delay: delay });
        TweenMax.to($button, duration * 1.25, { scaleX: 1, scaleY: 1, ease: Back.easeOut, easeParams: [6], delay: delay * 3 });
      });
    }
    return () => {
      if ($button) {
        $button.removeEventListener('click', () => { }); // 이벤트 리스너 제거
      }
    };
  }, []);

  const openModal = () => {
    dispatch(usageActions.openModal())
  }

  const modalClose = async () => {
    dispatch(usageActions.closeModal())
    try {
      const res = await instance.get("http://localhost:5000/shutdown");
      console.log(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className='backgroundImg'>
      <button ref={buttonRef} className='round' onClick={openModal}>
        <span className="button-text">Start</span>
      </button>
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            {/* 상단 부분 */}
            <div className="modal-header">
              <iframe src="http://localhost:5000/video_feed" width={1280} height={720}></iframe>
              <span className="close" onClick={modalClose}>&times;</span>
            </div>
            {/* 하단 부분 */}
            <div className="modal-body">
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translate;
