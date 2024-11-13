import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../css/Translate.css';
import instance from '../axios';
import { useDispatch, useSelector } from "react-redux"
import { usageActions } from '../redux/reducer/usageSlice';
import { TweenMax, Expo, Back } from 'gsap';
import axios from 'axios';
import '../css/Translate.css';
import { Unity, useUnityContext } from "react-unity-webgl";

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
  const [sentence, setSentence] = useState(""); // 서버에서 받은 문장 저장
  const [iframeChange, setIframeChange] = useState(false);
  const [sttText, setSttText] = useState(""); // STT 결과 저장
  const [keywords, setKeywords] = useState(""); // 키워드 추출 결과 저장
  const [isListening, setIsListening] = useState(false); // 음성 인식 중인지 여부 상태

  const modalClose = async () => {
    dispatch(usageActions.closeModal())
    try {
      const res = await instance.get("http://localhost:5000/shutdown");
      console.log(res.data);
    } catch (e) {
      console.error(e);
    }
  }

  // 서버로 단어 전송 및 문장 생성 및 TTS 출력
  const generateSentenceAndSpeak = useCallback(async () => {
    try {
      const response = await instance.post("http://localhost:5000/gpt_sentence", {
        word: ""
      });
      const generatedSentence = response.data.sentence;
      setSentence(generatedSentence);
      speakText(generatedSentence);
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  // 문장을 음성으로 출력
  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isModalOpen) {
      generateSentenceAndSpeak();
    }
  }, [isModalOpen, generateSentenceAndSpeak]);

  // STT 시작 함수
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
      setSttText(transcript); // STT 결과 저장
      console.log("STT 결과:", transcript);

      try {
        const response = await instance.post("http://localhost:5000/extract_keywords", {
          sentence: transcript
        });
        setKeywords(response.data.keywords);
      } catch (error) {
        console.error("Error extracting keywords:", error);
      }
    };

    recognition.onerror = (event) => {
      console.error("STT 오류:", event.error);
    };

    recognition.start();
  }, []);

  // 소리 감지 및 음성 인식 시작
  const startAudioProcessing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const microphone = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);

      let isListeningLocal = false; // 로컬 상태로 음성 감지 여부 관리

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const volume = sum / dataArray.length;

        // 소리가 일정 수준 이상 감지되면 STT를 시작하도록
        if (volume > 10 && !isListeningLocal) {
          isListeningLocal = true; // 음성 감지 시작
          setIsListening(true);    // 전역 상태 갱신
          startSTT();              // 소리가 감지되면 STT 시작
        } else if (volume <= 20 && isListeningLocal) {
          isListeningLocal = false; // 음성 감지 종료
          setIsListening(false);    // 전역 상태 갱신
        }

        requestAnimationFrame(checkVolume); // 지속적으로 소리 감지
      };

      checkVolume();
    } catch (error) {
      console.error("오디오 장치에 접근할 수 없습니다:", error);
    }
  }, [startSTT]); // startSTT가 변할 때만 다시 실행되도록 설정

  useEffect(() => {
    if (isModalOpen) {
      startAudioProcessing(); // 모달이 열리면 자동으로 소리 감지 시작
    }
  }, [isModalOpen, startAudioProcessing]);

  // unity 설정
  const { unityProvider } = useUnityContext({
    loaderUrl: "Build/cache2.loader.js",
    dataUrl: "Build/cache2.data",
    frameworkUrl: "Build/cache2.framework.js",
    codeUrl: "Build/cache2.wasm",
  });

  return (
    <div className='backgroundImg'>
       <img src='imgs/hello.gif' alt="Animation" className='.gif-animation' />
      <img src="imgs/blur-hospital.jpg" alt="" className='backgroundImage'/>
     
      <button ref={buttonRef} className='round' onClick={openModal}>
        <span className="button-text">Start</span>
      </button>
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            {/* 상단 부분 */}
            <div className="modal-header">
              {iframeChange ? 
                <iframe title={"Video Feed"} src={isModalOpen ? "http://localhost:5000/video_feed" : ""} width={1280} height={720}></iframe>
                :
                <Unity unityProvider={unityProvider} style={{width:"500px", height:"200px", zIndex:"500", background:"red"}}/>
              }
              <span className="close" onClick={modalClose}>&times;</span>
            </div>
            {/* 하단 부분 */}
            <div className="modal-body">
              {/* <div className="modal-body">
                {sentence ? <p>{sentence}</p> : <p>문장을 생성 중입니다...</p>}
              </div>
              {isListening && <p>음성 감지 중...</p>}
              {sttText && <p>STT 결과: {sttText}</p>}
              {keywords && <p>키워드 추출: {keywords}</p>} */}
              <button onClick={() => setIframeChange(!iframeChange)}>전환</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translate;