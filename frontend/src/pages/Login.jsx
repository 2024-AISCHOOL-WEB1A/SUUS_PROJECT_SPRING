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
        businessNum1: "", // 첫 번째 필드 (6자리)
        businessNum2: ""  // 두 번째 필드 (4자리)
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
        setSignUpCom((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    // 사업자번호 첫 번째 필드 입력 관리
    const handleBusinessNum1Change = (e) => {
        const value = e.target.value.slice(0, 6); // 최대 6자리까지만 입력
        setSignUpCom((prevData) => ({
            ...prevData,
            businessNum1: value
        }));
        if (value.length === 6) {
            document.getElementById("businessNum2").focus(); // 6자리 입력 시 다음 필드로 자동 이동
        }
    };

    // 사업자번호 두 번째 필드 입력 관리
    const handleBusinessNum2Change = (e) => {
        const value = e.target.value.slice(0, 4); // 최대 4자리까지만 입력
        setSignUpCom((prevData) => ({
            ...prevData,
            businessNum2: value
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
                businessNum: `${signUpCom.businessNum1}-${signUpCom.businessNum2}` // 사업자번호 합치기
            });

            alert(res.data);
            setSignUpCom({ 
                companyId: "", 
                companyPw: "", 
                companyName: "", 
                contact: "", 
                cardNum: "", 
                cardYuhyoDate: "", 
                businessNum1: "", 
                businessNum2: "" 
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
                                <input type="text" placeholder="카드 번호" name='cardNum'
                                    className="input" value={signUpCom.cardNum} onChange={handleSignComChange} />
                                <input type="text" placeholder="카드 유효기간" name='cardYuhyoDate'
                                    className="input" value={signUpCom.cardYuhyoDate} onChange={handleSignComChange} />
                                
                                {/* 사업자번호 두 필드로 분리 */}
                                <div className="input-group">
                                    <input type="text" placeholder="카드번호" name='businessNum1'
                                        className="input" value={signUpCom.businessNum1} onChange={handleBusinessNum1Change} maxLength="6" />
                                    <span>-</span>
                                    <input type="text" placeholder="" id="businessNum2" name='businessNum2'
                                        className="input" value={signUpCom.businessNum2} onChange={handleBusinessNum2Change} maxLength="4" />
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
