import React, { useEffect, useState } from 'react'
import "../css/UserInfo.css"
import instance from '../axios';

const UserInfo = ({ userInfo }) => {

    const [profileImage, setProfileImage] = useState('/imgs/Group.73.png'); // 업로드한 이미지 경로
    const [selectedFileName, setSelectedFileName] = useState('');

    const [companyResInfo, setCompanyResInfo] = useState(null);
    const [userResInfo, setUserResInfo] = useState(null);

    const handlecompanyChange = (e) => {
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

        setCompanyResInfo({
            ...companyResInfo,
            [name]: formattedValue
        });
    };

    const handleuserChange = (e) => {
        const { name, value } = e.target;
        setUserResInfo({
            ...userResInfo,
            [name]: value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setProfileImage(imageUrl);
            setSelectedFileName(file.name);
            localStorage.setItem('profileImage', imageUrl);
        }
    };

    useEffect(() => {
        const savedImage = localStorage.getItem('profileImage');
        if (savedImage) {
            setProfileImage(savedImage);
        }
    }, []);

    useEffect(() => {
        getUserInfo()
    }, [])

    const getUserInfo = async () => {

        const info = {
            userId: userInfo.userId || userInfo.companyId,
            type: userInfo.userId ? "개인" : "기업"
        }

        try {
            const res = await instance.post("/UserInfo", info)

            if (info.type === "기업") {
                setCompanyResInfo(res.data)  // 기업 정보 업데이트
                setUserResInfo(null)
            } else {
                setUserResInfo(res.data)
                setCompanyResInfo(null)
            }
        }
        catch (error) {
            console.log(error.response.data)
        }
    }

    const updateCompanyInfo = async (e) => {
        e.preventDefault()
        try{
            const res = await instance.post("/UpdateCompanyInfo", companyResInfo)
            
            if(res.data){
                alert("정보수정 성공")  
                setCompanyResInfo(res.data)
            } 
            
        }
        catch(error){
            console.log(error.response.data)
        }
    }

    const updateUserInfo = async (e) => {
        e.preventDefault()
        try{
            const res = await instance.post("/UpdateUserInfo", userResInfo)

            if(res.data){
                alert("정보수정 성공")                
                setUserResInfo(res.data)
            }
        }
        catch(error){
            console.log(error.response.data)
        }
    }

    return (
        <div className="account-setting">
            <h2 className='h2person'>Account Setting</h2>
            {/* <div className="tabs">
                탭 내용
            </div> */}
            <div className="profile-section">
                <div className="profile-image">
                    <img src={profileImage} alt="Profile" />
                    <label className="change-button">
                        Change Here
                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>
                </div>
                <div className="profile-info">
                    {companyResInfo &&
                        <form>
                            <div className="form-row">
                                <div>
                                    <label>ID</label>
                                    <input type="text" name="companyId" value={companyResInfo.companyId} disabled />
                                </div>
                                <div>
                                    <label>COMPANY</label>
                                    <input type="text" name="companyName" value={companyResInfo.companyName} onChange={handlecompanyChange} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    <label>PASSWORD</label>
                                    <input type="password" name="companyPw" value={companyResInfo.companyPw} onChange={handlecompanyChange} />
                                </div>
                                <div>
                                    <label>contact</label>
                                    <input type="text" name="contact" maxLength="13" value={companyResInfo.contact} onChange={handlecompanyChange} placeholder='000-0000-0000' />
                                </div>
                            </div>
                            <button className="save-button" onClick={updateCompanyInfo}>Save</button>
                        </form>
                    }

                    {userResInfo &&
                        <form>
                            <div className="form-row">
                                <div>
                                    <label>ID</label>
                                    <input type="text" name="userId" value={userResInfo.userId} disabled />
                                </div>
                                <div>
                                    <label>NAME</label>
                                    <input type="text" name="userName" value={userResInfo.userName} onChange={handleuserChange} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    <label>PASSWORD</label>
                                    <input type="password" name="userPw" value={userResInfo.userPw} onChange={handleuserChange} />
                                </div>
                                <div>
                                    <label>COMPANYID</label>
                                    <input type="text" name="companyId" value={userResInfo.companyId} onChange={handleuserChange} disabled />
                                </div>
                            </div>
                            <button className="save-button" onClick={updateUserInfo}>Save</button>
                        </form>
                    }
                </div>
            </div>
        </div>
    );
}

export default UserInfo