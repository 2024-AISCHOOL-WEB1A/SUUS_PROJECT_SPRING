import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../css/Translate.css';
import instance from '../axios';
import { useDispatch, useSelector } from "react-redux";
import { usageActions } from '../redux/reducer/usageSlice';
import axios from 'axios';

const Translate = () => {
  const buttonRef = useRef(null); // 버튼 참조
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((state) => state.usage);

  const openModal = () => {
    dispatch(usageActions.openModal());
  };
  
  const [sentence, setSentence] = useState(""); // 서버에서 받은 문장 저장
  const [iframeChange, setIframeChange] = useState(false);
  const [sttText, setSttText] = useState(""); // STT 결과 저장
  const [keywords, setKeywords] = useState(""); // 키워드 추출 결과 저장
  const [isListening, setIsListening] = useState(false); // 음성 인식 중인지 여부 상태

  const modalClose = async () => {
    dispatch(usageActions.closeModal());
    try {
      const res = await instance.get("http://localhost:5000/shutdown");
      console.log(res.data);
    } catch (e) {
      console.error(e);
    }
  };

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
      setSttText(transcript);
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

  const startAudioProcessing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const microphone = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
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
        } else if (volume <= 20 && isListeningLocal) {
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

  return (
    <div className="backgroundImg">
      <img src="/imgs/blur-hospital.jpg" alt="" className="backgroundImage" />
      <img src="/imgs/hello.gif" alt="Animation" className="gif-animation" />
      <span className="texttitle">수어 번역을 시작하기 위해서 버튼을 눌러주세요</span>

      <button ref={buttonRef} className="round" onClick={openModal}>
        <span className="button-text">Start</span>
      </button>
      
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              {iframeChange ? (
                <iframe title="Video Feed" src={isModalOpen ? "http://localhost:5000/video_feed" : ""} width={1280} height={720}></iframe>
              ) : (
                <iframe title="Empty Frame" src="" width={1280} height={720}></iframe>
              )}
              <span className="close" onClick={modalClose}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="modal-body">
                {sentence ? <p>{sentence}</p> : <p>문장을 생성 중입니다...</p>}
              </div>
              {isListening && <p>음성 감지 중...</p>}
              {sttText && <p>STT 결과: {sttText}</p>}
              {keywords && <p>키워드 추출: {keywords}</p>}
              <button onClick={() => setIframeChange(!iframeChange)}>전환</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translate;
