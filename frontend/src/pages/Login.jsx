import React, { useState } from 'react';
import instance from '../axios';
import "../css/Login.css";
import { useNavigate } from 'react-router-dom';

const Login_min = () => {
    const nav = useNavigate();

    // 토글 관련 state
    const [toggle, setToggle] = useState(false);
    const [userType, setUserType] = useState('개인');

    // company 가입 state
    const [signUpCom, setSignUpCom] = useState({
        companyId: "",
        companyPw: "",
        companyName: "",
        contact: "",
        cardNum: "",
        cardYuhyoDate: "",
        ssnFront: "",
        ssnBack: ""
    });

    // user 가입 입력 state
    const [signUpUser, setSignUpUser] = useState({
        userId: "",
        userPw: "",
        userName: "",
        companyId: ""
    });

    const [signIn, setSignIn] = useState({
        signId: "",
        signPw: "",
    });

    // company 가입 입력 state 관리
    const handleSignComChange = (e) => {
        const { name, value } = e.target;

        let formattedValue = value;

        if (name === "contact") { // 전화번호 필드의 name 속성이 "phoneNumber"라고 가정
            const onlyNumbers = value.replace(/\D/g, ""); // 숫자만 남기기
            if (onlyNumbers.length <= 3) {
                formattedValue = onlyNumbers;
            } else if (onlyNumbers.length <= 7) {
                formattedValue = `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(3)}`;
            } else {
                formattedValue = `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(3, 7)}-${onlyNumbers.slice(7, 11)}`;
            }
        }

        if (name === "cardNum") { // "cardNumber" 필드가 카드번호 입력
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

        if (name === "cardYuhyoDate") { // "expiryDate" 필드가 카드 유효날짜 입력
            const onlyNumbers = value.replace(/\D/g, ""); // 숫자만 남기기
            if (onlyNumbers.length <= 2) {
                formattedValue = onlyNumbers; // 2자리 이하일 때 그대로 사용
            } else {
                formattedValue = `${onlyNumbers.slice(0, 2)}/${onlyNumbers.slice(2, 4)}`; // "MM / YY" 형식
            }
        }

        setSignUpCom((prevData) => ({
            ...prevData,
            [name]: formattedValue
        }));
    };

    // 사업자번호 첫 번째 필드 입력 관리
    const handleSsnFrontChange = (e) => {
        const value = e.target.value.slice(0, 6); // 최대 6자리까지만 입력
        setSignUpCom((prevData) => ({
            ...prevData,
            ssnFront: value
        }));
        if (value.length === 6) {
            document.getElementById("ssnBack").focus(); // 6자리 입력 시 다음 필드로 자동 이동
        }
    };

    // 사업자번호 두 번째 필드 입력 관리
    const handleSsnBackChange = (e) => {
        const value = e.target.value.slice(0, 4); // 최대 4자리까지만 입력
        setSignUpCom((prevData) => ({
            ...prevData,
            ssnBack: value
        }));
    };

    // user 가입 입력 state 관리
    const handleSignUserChange = (e) => {
        const { name, value } = e.target;
        setSignUpUser((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    // login 입력 state 관리
    const handleSignInChange = (e) => {
        const { name, value } = e.target;
        setSignIn((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    // 모든 필드가 입력되어 있는지 확인
    const isFormFilled = (formData) => {
        return Object.values(formData).every(value => value.trim() !== "");
    };

    // 기업아이디 중복 확인
    const duplicateComId = async () => {
        try {
            const res = await instance.post("/ComIdDuplicate", { companyId: signUpCom.companyId });
            alert(res.data ? "중복된 아이디입니다." : "사용 가능한 아이디입니다.");
        }
        catch (error) {
            console.error(error)
            alert("예기치 못한 오류가 발생했습니다.");
        }
    };

    // 기업 회원가입 
    const submitComSignUp = async () => {
        if (!isFormFilled(signUpCom)) {
            alert("모든 필드를 입력해주세요.");
            return;
        }
        try {
            const res = await instance.post("/SignUpCom", {
                companyId: signUpCom.companyId,
                companyPw: signUpCom.companyPw,
                companyName: signUpCom.companyName,
                contact: signUpCom.contact,
                cardNum: signUpCom.cardNum,
                cardYuhyoDate: signUpCom.cardYuhyoDate,
                ssnNum: `${signUpCom.ssnFront}${signUpCom.ssnBack}` // 사업자번호 합치기
            });

            alert(res.data);
            setSignUpCom({
                companyId: "",
                companyPw: "",
                companyName: "",
                contact: "",
                cardNum: "",
                cardYuhyoDate: "",
                ssnFront: "",
                ssnBack: ""
            });
        }
        catch (error) {
            alert(error.response.data);
        }
    };

    // userId 중복 확인
    const duplicateUserId = async () => {
        try {
            const res = await instance.post("/UserIdDuplicate", { userId: signUpUser.userId });
            alert(res.data ? "중복된 아이디입니다." : "사용 가능한 아이디입니다.");
        }
        catch (error) {
            alert("예기치 못한 오류가 발생했습니다.");
        }
    };

    // 유저 회원가입
    const submitUserSignUp = async () => {
        if (!isFormFilled(signUpUser)) {
            alert("모든 필드를 입력해주세요.");
            return;
        }
        try {
            const res = await instance.post("/SignUpUser", {
                userId: signUpUser.userId,
                userPw: signUpUser.userPw,
                userName: signUpUser.userName,
                companyId: signUpUser.companyId
            });
            alert(res.data);
            setSignUpUser({ userId: "", userPw: "", userName: "", companyId: "" });
        }
        catch (error) {
            alert(error.response.data);
        }
    };

    // 유저 로그인
    const submitSignIn = async () => {
        if (!isFormFilled(signIn)) {
            alert("모든 필드를 입력해주세요.");
            return;
        }
        try {
            const res = await instance.post("/SignIn", { signType: userType, signId: signIn.signId, signPw: signIn.signPw });
            if (res.status === 200) {
                alert(`${res.data.userName}님 환영합니다!`);
                localStorage.setItem("userInfo", JSON.stringify(res.data));
                setSignIn({ signId: "", signPw: "" });
                nav("/main");
            }
        }
        catch (error) {
            alert(error.response?.data || "로그인 실패..");
        }
    };

    return (
        <div className="wrapper-login">
            <div className="container-login">
                {toggle ? (
                    <div className={`sign-up-container ${!toggle ? 'active' : ''}`}>
                        <h2>회원가입</h2>
                        <div className="radio-container">
                            <label className="radio-button">
                                <input type="radio" value="기업" checked={userType === '기업'}
                                    onChange={() => setUserType('기업')} />
                                기업 회원
                            </label>
                            <label className="radio-button">
                                <input type="radio" value="개인" checked={userType === '개인'}
                                    onChange={() => setUserType('개인')} />
                                개인 회원
                            </label>
                        </div>

                        {userType === '기업' ? (
                            <>
                                <div className="input-group">
                                    <input type="text" placeholder="아이디" name='companyId'
                                        className='input' value={signUpCom.companyId} onChange={handleSignComChange} />
                                    <button className="check-button" onClick={duplicateComId}>중복 확인</button>
                                </div>
                                <input type="password" placeholder="비밀번호" name='companyPw'
                                    className="input" value={signUpCom.companyPw} onChange={handleSignComChange} />
                                <input type="text" placeholder="기업이름" name='companyName'
                                    className="input" value={signUpCom.companyName} onChange={handleSignComChange} />
                                <input type="text" placeholder="담당자 전화번호" name='contact'
                                    className="input" value={signUpCom.contact} onChange={handleSignComChange} />
                                <input type="text" placeholder="카드 번호" name='cardNum' maxLength='20'
                                    className="input" value={signUpCom.cardNum} onChange={handleSignComChange} />
                                <input type="text" placeholder="카드 유효기간" name='cardYuhyoDate'
                                    className="input" value={signUpCom.cardYuhyoDate} onChange={handleSignComChange} />

                                {/* 사업자번호 두 필드로 분리 */}
                                <div className="input-group">
                                    <input type="text" placeholder="주민등록번호 6자리" name='ssnFront'
                                        className="input" value={signUpCom.ssnFront} onChange={handleSsnFrontChange} maxLength="6" />
                                    <span>-</span>

                                    <input type="text" placeholder="" name='ssnBack' id='ssnBack'
                                        className="backinput" value={signUpCom.ssnBack} onChange={handleSsnBackChange} maxLength="1" />
                                    <span>******</span>
                                </div>

                                <button className="submit-button" onClick={submitComSignUp}>Sign Up</button>
                            </>
                        ) : (
                            <>
                                <div className="input-group">
                                    <input type="text" placeholder="회원 아이디" name='userId'
                                        className='input' value={signUpUser.userId} onChange={handleSignUserChange} />
                                    <button className="check-button" onClick={duplicateUserId}>중복 확인</button>
                                </div>
                                <input type="password" placeholder="비밀번호" name='userPw'
                                    className="input" value={signUpUser.userPw} onChange={handleSignUserChange} />
                                <input type="text" placeholder="회원 이름" name='userName'
                                    className="input" value={signUpUser.userName} onChange={handleSignUserChange} />
                                <input type="text" placeholder="기업 아이디" name='companyId'
                                    className="input" value={signUpUser.companyId} onChange={handleSignUserChange} />
                                <button className="submit-button" onClick={submitUserSignUp}>Sign Up</button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className={`sign-in-container ${toggle ? 'active' : ''}`}>
                        <h2>로그인</h2>
                        <div className="radio-container">
                            <label className="radio-button">
                                <input type="radio" value="기업" checked={userType === '기업'}
                                    onChange={() => setUserType('기업')} />
                                기업 회원
                            </label>
                            <label className="radio-button">
                                <input type="radio" value="개인" checked={userType === '개인'}
                                    onChange={() => setUserType('개인')} />
                                개인 회원
                            </label>
                        </div>

                        <input type="text" placeholder="아이디" name='signId'
                            className="input" value={signIn.signId} onChange={handleSignInChange} />
                        <input type="password" placeholder="비밀번호" name='signPw'
                            className="input" value={signIn.signPw} onChange={handleSignInChange} />
                        <button className="submit-button" onClick={submitSignIn}>Sign In</button>
                    </div>
                )}

                <div className={`overlay-container ${toggle ? 'toggle' : ''}`}>
                    <img src="/imgs/Group73.png" alt="Group" className="overlay-image" />
                    <h2 className="overlay-title">{toggle ? 'Hello Friend!' : 'Welcome Back!'}</h2>
                    <p>{toggle ? '수어스 페이지에 가입해주세요.' : '수어스 홈페이지에 환영합니다'}</p>
                    <button className="switch-button" onClick={() => setToggle(!toggle)}>
                        {toggle ? '로그인 하기' : '회원가입 하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login_min;
