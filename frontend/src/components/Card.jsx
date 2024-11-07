import React, { useState } from 'react';
import '../css/card.css'; // 올바른 경로 확인 필요
import instance from '../axios'

function CreditCardForm() {
  const [cardNumber, setCardNumber] = useState('123456789123****');
  const [cardMonth, setCardMonth] = useState('07');
  const [cardYear, setCardYear] = useState('29');
  const [residentFront, setResidentFront] = useState('001216');
  const [residentBack, setResidentBack] = useState('4');
  const [isFocused, setIsFocused] = useState(false);

  const cardBackground = '/imgs/카드.png';

  const handleCardNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 16) {
      setCardNumber(value);
    }
  };

  const handleCardMonthChange = (e) => {
    if (e.target.value.length <= 2 && /^\d*$/.test(e.target.value)) {
      setCardMonth(e.target.value);
    }
  };

  const handleCardYearChange = (e) => {
    if (e.target.value.length <= 2 && /^\d*$/.test(e.target.value)) {
      setCardYear(e.target.value);
    }
  };

  const handleResidentFrontChange = (e) => {
    setResidentFront(e.target.value);
  };

  const handleResidentBackChange = (e) => {
    if (e.target.value.length <= 1) {
      setResidentBack(e.target.value);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className="wrapper2">
      <div className="card-form">
        <div className={`card-item ${isFocused ? 'focused' : ''}`} style={{ backgroundImage: `url(${cardBackground})` }}>
          <div className="card-item__side -front">
            <div className="card-item__wrapper">
              <div className="card-number-container">
                <div className="card-item__number">
                  {cardNumber ? cardNumber : '1234 #### #### ####'}
                </div>
              </div>
              <div className="card-item__date">
                <span>{cardMonth ? cardMonth : 'MM'}</span> / <span>{cardYear ? cardYear : 'YY'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card-form__inner">
          <div className="card-input">
            <label className="card-input__label">Card Number</label>
            <input
              type="text"
              className="card-input__input"
              value={cardNumber}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleCardNumberChange}
              placeholder="Card Number"
              maxLength="16"
            />
          </div>
          <div className="card-form__row">
            <div className="card-form__col">
              <label className="card-input__label">Expiration Month</label>
              <input
                type="text"
                className="card-input__input"
                value={cardMonth}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleCardMonthChange}
                placeholder="MM"
                maxLength="2"
              />
            </div>
            <div className="card-form__col">
              <label className="card-input__label">Expiration Year</label>
              <input
                type="text"
                className="card-input__input"
                value={cardYear}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleCardYearChange}
                placeholder="YY"
                maxLength="2"
              />
            </div>
          </div>
          <div className="card-input">
            <label className="card-input__label">주민등록번호</label>
            <div className="resident-number-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="card-input__input resident-number-front"
                value={residentFront}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleResidentFrontChange}
                placeholder="앞 7자리"
                maxLength="7"
                style={{ marginRight: '5px' }}
              />
              <span>-</span>
              <input
                type="text"
                className="card-input__input resident-number-back"
                value={residentBack}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleResidentBackChange}
                placeholder=""
                maxLength="1"
                style={{ width: '30px', marginLeft: '5px' }}
              />
              <span className="masked-back">******</span>
            </div>
          </div>
          <button className="card-form__button" onClick={() => alert('카드 정보가 수정되었습니다!')}>카드 정보 수정하기</button>
        </div>
      </div>
    </div>
  );
}

export default CreditCardForm;
