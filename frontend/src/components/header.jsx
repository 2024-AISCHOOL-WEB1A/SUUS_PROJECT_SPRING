import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// 글로벌 스타일 정의
const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Pretendard-Regular';
    src: url('https://fastly.jsdelivr.net/gh/Project-Noonnu/noonfonts_2107@1.1/Pretendard-Regular.woff') format('woff');
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: 'CookieRun-Regular';
    src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/CookieRun-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }
`;

const HeaderContainer = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 10px 0px;
  // margin-bottom: 10px 0px;
`;

const Title = styled.h1`
  color: #546999; /* 주어진 색상 */
  font-family: 'CookieRun-Regular', sans-serif; /* CookieRun-Regular 폰트 적용 */
  font-size: 2rem; /* 제목 크기 조정 */
  margin: 0; /* 기본 마진 제거 */
`;

const Subtitle = styled.p`
  color: black; /* 검정색 */
  font-family: 'Pretendard-Regular', sans-serif; /* Pretendard 폰트 사용 */
  font-size: 1.2rem; /* 부제목 크기 조정 */
  margin: 5px 0 0; /* 위쪽 마진만 추가 */
`;

const Header = () => {
  return (
    <>
      <GlobalStyle /> {/* 글로벌 스타일 적용 */}
      <HeaderContainer>
        <Title >수어스</Title>
        <Subtitle>우리의 소리를 담아 너에게</Subtitle>
      </HeaderContainer>
    </>
  );
};

export default Header;
