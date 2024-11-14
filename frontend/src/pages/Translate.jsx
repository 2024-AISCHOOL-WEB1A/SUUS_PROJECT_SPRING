import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../css/Translate.css';
import instance from '../axios';
import { useDispatch, useSelector } from "react-redux";
import { usageActions } from '../redux/reducer/usageSlice';
import '../css/Translate.css';
import { Unity, useUnityContext } from "react-unity-webgl";

const Translate = () => {
  const buttonRef = useRef(null); // 버튼 참조
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((state) => state.usage);
  const [sentence, setSentence] = useState(""); // 서버에서 받은 문장 저장
  const [iframeChange, setIframeChange] = useState(false);
  const [sttTextList, setSttTextList] = useState([]); // STT 결과를 배열로 저장
  const [keywordsList, setKeywordsList] = useState([]); // 키워드 추출 결과를 배열로 저장
  const [isListening, setIsListening] = useState(false); // 음성 인식 중인지 여부 상태
  const [videoSrc, setVideoSrc] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0); // 현재 재생 중인 키워드의 인덱스

  const openModal = () => {
    dispatch(usageActions.openModal());
  };

  const modalClose = async () => {
    dispatch(usageActions.closeModal());
    try {
      const res = await instance.get("http://localhost:5000/shutdown");
    } catch (e) {
      console.error(e);
    }
  };

  const startSTT = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("STT 기능이 지원되지 않는 브라우저입니다.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setSttTextList((prev) => [...prev, transcript]);
    
      try {
        const response = await instance.post("http://localhost:5000/extract_keywords", { sentence: transcript });
        let newKeywords = response.data.keywords;
    
        // newKeywords가 배열이 아닌 문자열일 경우 쉼표로 분리하여 배열로 변환
        if (typeof newKeywords === "string") {
          newKeywords = newKeywords.split(",").map(keyword => keyword.trim());
        }
    
        setKeywordsList((prev) => [...prev, ...newKeywords]);
      } catch (error) {
        console.error("Error extracting keywords:", error);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        console.error("STT 오류:", event.error);
      }
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const startAudioProcessing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const microphone = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);
      let isListeningLocal = false;

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const volume = sum / dataArray.length;

        if (volume > 10 && !isListeningLocal) {
          isListeningLocal = true;
          setIsListening(true);
          startSTT();
        } else if (volume <= 10 && isListeningLocal) {
          isListeningLocal = false;
          setIsListening(false);
        }

        requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (error) {
      console.error("오디오 장치에 접근할 수 없습니다:", error);
    }
  }, [startSTT]);

  useEffect(() => {
    if (isModalOpen) {
      startAudioProcessing();
    }
  }, [isModalOpen, startAudioProcessing]);

  // 키워드 목록에서 비디오 파일이 있는지 확인 및 순차 재생
  useEffect(() => {
    if (keywordsList.length > 0 && currentIndex < keywordsList.length) {
      const matchedKeyword = keywordsList[currentIndex];
      setVideoSrc(`http://localhost:5000/video/${encodeURIComponent(matchedKeyword)}`);
    }
  }, [keywordsList, currentIndex]);

  // 비디오가 끝날 때마다 다음 키워드의 비디오를 재생
  const handleVideoEnd = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  // unity 설정
  const { unityProvider } = useUnityContext({
    loaderUrl: "Build/cache2.loader.js",
    dataUrl: "Build/cache2.data",
    frameworkUrl: "Build/cache2.framework.js",
    codeUrl: "Build/cache2.wasm",
  });

  const speakText = (text) => {
    setSentence(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let ws; // WebSocket 객체
    let pingInterval; // 핑 메시지를 위한 인터벌

    // WebSocket 이벤트 핸들러 정의
    const handleOpen = () => {
      console.log("WebSocket 연결 성공");

      // 30초마다 핑 메시지 전송
      pingInterval = setInterval(() => {
        ws.send(JSON.stringify({ type: "ping" }));
      }, 3000);
    };

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("수신 데이터:", data.sentence.content);

        // 수신된 문장을 상태에 추가
        if (data.sentence) {
          speakText(data.sentence)
        }
      } catch (error) {
        console.error("JSON 파싱 에러:", error);
      }
    };

    const handleError = (error) => {
      console.error("WebSocket 에러 발생:", error.message || error);
    };

    const handleClose = (event) => {
      console.log("WebSocket 연결 종료", "코드:", event.code, "이유:", event.reason);
      clearInterval(pingInterval); // WebSocket 종료 시 인터벌 제거

      if (event.code !== 1000) {
        console.error("비정상 종료: 재연결 시도 중...");
        setTimeout(() => {
          initializeWebSocket(); // 재연결
        }, 2000);
      }
    };

    const initializeWebSocket = () => {
      ws = new WebSocket("ws://localhost:5000/ws/prediction");
      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onerror = handleError;
      ws.onclose = handleClose;
    };

    if (isModalOpen) {
      initializeWebSocket(); // 모달 열릴 때 WebSocket 초기화
    }

    return () => {
      // 모달이 닫힐 때 WebSocket 및 인터벌 정리
      if (ws) ws.close();
      clearInterval(pingInterval);
    };
  }, [isModalOpen]);

  return (
    <div className="backgroundImg">
      <img src="/imgs/blur-hospital.jpg" className="backgroundImage" />
      <img src="/imgs/hello.gif" className="gif-animation" />
      <span className="texttitle">수어 번역을 시작하기 위해서 버튼을 눌러주세요</span>

      <button ref={buttonRef} className="round" onClick={openModal}>
        <span className="button-text">Start</span>
      </button>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              {iframeChange ?
                <iframe title="Video Feed" src={isModalOpen ? "http://localhost:5000/video_feed" : ""} width={1300} height={725}></iframe>
                :
                <Unity unityProvider={unityProvider} style={{ width: "1280px", height: "720px", zIndex: "500" }} />
              }
              <span className="close" onClick={modalClose}>&times;</span>
            </div>
            <div className="modal-body">
              {sentence ? <p>{sentence}</p> : <p>문장을 생성 중입니다...</p>}
              {sttTextList.length > 0 && sttTextList.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
              {keywordsList.length > 0 && keywordsList.map((keyword, index) => (
                <p key={index}>{keyword}</p>
              ))}
              {isListening && <p>음성 감지 중...</p>} {/* 음성 감지 중일 때 표시 */}
              <button onClick={() => setIframeChange(!iframeChange)}>전환</button>
              {/* video 나타나는 곳 */}
              <video src={videoSrc} width={400} height={300} autoPlay  onEnded={handleVideoEnd} style={{
                position: 'absolute',
                bottom: '310px',  // 하단 10px 위치
                right: '285px',   // 오른쪽 10px 위치
                zIndex: 10,      // iframe 위에 표시되도록
              }}>

              </video>
              <button onClick={() => setIframeChange(!iframeChange)}className='changebtn'>전환</button>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translate;
