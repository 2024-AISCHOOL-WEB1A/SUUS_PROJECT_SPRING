import React, { useState } from 'react';
import '../css/Translate.css';

const Translate = () => {

  const [isModalOpen, setIsModalOpen] = useState(false); // 모달창 상태 관리

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
              <h2> Hand Sign Translator</h2>
              <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
            </div>
            {/* 하단 부분 */}
            <div className="modal-body">
              <p>This is the lower body content of the modal.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default Translate;
