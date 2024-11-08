import React, { useEffect, useState } from 'react';
import '../css/Card.css';
import instance from '../axios'

const Card = ({ userInfo }) => {
  const cardBackground = './imgs/card.png';

  const [isFocused, setIsFocused] = useState(false);
  const [cardInfo, setCardInfo] = useState({
    cardNum: "",
    cardMonth: "",
    cardYear: "",
    ssnFront: "",
    ssnBack: ""
  })

  const handleSignComChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;

    if (name === "cardNum") {
      const onlyNumbers = value.replace(/\D/g, ""); // 숫자만 남기기
      if (onlyNumbers.length <= 4) {
        formattedValue = onlyNumbers;
      } else if (onlyNumbers.length <= 8) {
        formattedValue = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4)}`;
      } else if (onlyNumbers.length <= 12) {
        formattedValue = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4, 8)}-${onlyNumbers.slice(8)}`;
      } else {
        formattedValue = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4, 8)}-${onlyNumbers.slice(8, 12)}-${onlyNumbers.slice(12, 16)}`;
      }
    }

    setCardInfo((prevData) => ({
      ...prevData,
      [name]: formattedValue
    }));
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  useEffect(() => {
    getCardData()
  }, [])

  const getCardData = async () => {
    try {
      const res = await instance.post("/GetCardData", { companyId: userInfo.companyId })
      setCardInfo(res.data)
    }
    catch (error) {
      console.error(error)
    }
  }

  const updateCardData = async () => {
    const res = await instance.post("/UpdateCardData", cardInfo)
  }

  return (
    <div className="wrapper2">
      <div className="card-form">
        <div className={`card-item ${isFocused ? 'focused' : ''}`} style={{ backgroundImage: `url(${cardBackground})` }}>
          <div className="card-item__side -front">
            <div className="card-item__wrapper">
              <div className="card-number-container">
                <div className="card-item__number">
                  {cardInfo.cardNum ? cardInfo.cardNum : ''}
                </div>
              </div>
              <div className="card-item__date">
                <span>{cardInfo.cardMonth ? cardInfo.cardMonth : 'MM'}</span> / <span>{cardInfo.cardYear ? cardInfo.cardYear : 'YY'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card-form__inner">
          <div className="card-input">
            <label className="card-input__label">Card Number</label>
            <input type="text" name='cardNum' className="card-input__input"
              value={cardInfo.cardNum} onFocus={handleFocus} onBlur={handleBlur} onChange={handleSignComChange}
              placeholder="Card Number" maxLength="20"
            />
          </div>

          <div className="card-form__row">
            <div className="card-form__col">
              <label className="card-input__label">Expiration Month</label>
              <input type="text" name='cardMonth' className="card-input__input"
                value={cardInfo.cardMonth} onFocus={handleFocus} onBlur={handleBlur} onChange={handleSignComChange}
                placeholder="MM" maxLength="2" />
            </div>

            <div className="card-form__col">
              <label className="card-input__label">Expiration Year</label>
              <input type="text" name='cardYear' className="card-input__input"
                value={cardInfo.cardYear} onFocus={handleFocus} onBlur={handleBlur} onChange={handleSignComChange}
                placeholder="YY" maxLength="2" />
            </div>
          </div>

          <div className="card-input">
            <label className="card-input__label">주민등록번호</label>
            <div className="resident-number-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
              <input type="text" name='ssnFront' className="card-input__input resident-number-front"
                value={cardInfo.ssnFront} onFocus={handleFocus} onBlur={handleBlur} onChange={handleSignComChange}
                placeholder="앞 6자리" maxLength="6" />

              <span>-</span>

              <input type="text" name='ssnBack' className="card-input__input resident-number-back"
                value={cardInfo.ssnBack} onFocus={handleFocus} onBlur={handleBlur} onChange={handleSignComChange}
                maxLength="2" style={{ maxWidth: '50px', marginLeft: '5px' }} />
              <input type="text" value="* * * * * *" className="card-input__input" style={{ maxWidth: '200px', border: 'none', backgroundColor: 'white' }} disabled />
            </div>
          </div>
          <button className="card-form__button" onClick={updateCardData}>카드 정보 수정하기</button>
        </div>
      </div>
    </div>
  );
}

export default Card;
