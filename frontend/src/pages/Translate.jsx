import React, { useState, useEffect, useCallback } from 'react';
import '../css/Translate.css';
import instance from '../axios';

const Translate = () => {

  const [isModalOpen, setIsModalOpen] = useState(false); // 모달창 상태 관리
  const [sentence, setSentence] = useState(""); // 서버에서 받은 문장 저장
  const [iframeChange, setIframeChange] = useState(false);
  const [sttText, setSttText] = useState(""); // STT 결과 저장
  const [keywords, setKeywords] = useState(""); // 키워드 추출 결과 저장
  const [isListening, setIsListening] = useState(false); // 음성 인식 중인지 여부 상태

  const modalClose = async () => {
    setIsModalOpen(false);
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
              {iframeChange ? 
                <iframe title={"Video Feed"} src={isModalOpen ? "http://localhost:5000/video_feed" : ""} width={1280} height={720}></iframe>
                :
                <iframe title={"Empty Frame"} src="" width={1280} height={720}></iframe>
              }
              <span className="close" onClick={modalClose}>&times;</span>
            </div>
            {/* 하단 부분 */}
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















// import React, { useState, useEffect, useCallback } from 'react';
// import '../css/Translate.css';
// import instance from '../axios';

// const Translate = () => {

//   const [isModalOpen, setIsModalOpen] = useState(false); // 모달창 상태 관리
//   const [sentence, setSentence] = useState(""); // 서버에서 받은 문장 저장
//   const [iframeChange, setIframeChange] = useState(false);
//   const [sttText, setSttText] = useState(""); // STT 결과 저장
//   const [keywords, setKeywords] = useState(""); // 키워드 추출 결과 저장
//   const [isListening, setIsListening] = useState(false); // 음성 인식 중인지 여부 상태
//   const [videoUrl, setVideoUrl] = useState(""); // 비디오 URL 상태

//   const modalClose = async () => {
//     setIsModalOpen(false);
//     try {
//       const res = await instance.get("http://localhost:5000/shutdown");
//       console.log(res.data);
//     } catch (e) {
//       console.error(e);
//     }
//   }

//   // 서버로 단어 전송 및 문장 생성 및 TTS 출력
//   const generateSentenceAndSpeak = useCallback(async () => {
//     try {
//       const response = await instance.post("http://localhost:5000/gpt_sentence", {
//         word: "나 병원 오다"
//       });
//       const generatedSentence = response.data.sentence;
//       setSentence(generatedSentence);
//       speakText(generatedSentence);
//     } catch (error) {
//       console.error("Error:", error);
//     }
//   }, []);

//   // 문장을 음성으로 출력
//   const speakText = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = 'ko-KR';
//     window.speechSynthesis.speak(utterance);
//   };

//   useEffect(() => {
//     if (isModalOpen) {
//       generateSentenceAndSpeak();
//     }
//   }, [isModalOpen, generateSentenceAndSpeak]);

//   // STT 시작 함수
//   const startSTT = useCallback(() => {
//     if (!("webkitSpeechRecognition" in window)) {
//       alert("STT 기능이 지원되지 않는 브라우저입니다.");
//       return;
//     }

//     const recognition = new window.webkitSpeechRecognition();
//     recognition.lang = "ko-KR";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     recognition.onresult = async (event) => {
//       const transcript = event.results[0][0].transcript;
//       setSttText(transcript); // STT 결과 저장
//       console.log("STT 결과:", transcript);

//       try {
//         const response = await instance.post("http://localhost:5000/extract_keywords", {
//           sentence: transcript
//         });
//         const extractedKeywords = response.data.keywords;
//         setKeywords(extractedKeywords);

//         // 추출된 키워드에 맞는 비디오 URL 설정
//         const videoFile = `${extractedKeywords}.mp4`; // 예: "병원.mp4"
//         setVideoUrl(`http://localhost:5000/video/${videoFile}`);
//       } catch (error) {
//         console.error("Error extracting keywords:", error);
//       }
//     };

//     recognition.onerror = (event) => {
//       console.error("STT 오류:", event.error);
//     };

//     recognition.start();
//   }, []);

//   // 소리 감지 및 음성 인식 시작
//   const startAudioProcessing = useCallback(async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//       const microphone = audioContext.createMediaStreamSource(stream);
//       const analyser = audioContext.createAnalyser();
//       analyser.fftSize = 512;
//       microphone.connect(analyser);

//       const dataArray = new Uint8Array(analyser.fftSize);

//       let isListeningLocal = false; // 로컬 상태로 음성 감지 여부 관리

//       const checkVolume = () => {
//         analyser.getByteFrequencyData(dataArray);
//         const sum = dataArray.reduce((a, b) => a + b, 0);
//         const volume = sum / dataArray.length;

//         // 소리가 일정 수준 이상 감지되면 STT를 시작하도록
//         if (volume > 30 && !isListeningLocal) {
//           isListeningLocal = true; // 음성 감지 시작
//           setIsListening(true);    // 전역 상태 갱신
//           startSTT();              // 소리가 감지되면 STT 시작
//         } else if (volume <= 30 && isListeningLocal) {
//           isListeningLocal = false; // 음성 감지 종료
//           setIsListening(false);    // 전역 상태 갱신
//         }

//         requestAnimationFrame(checkVolume); // 지속적으로 소리 감지
//       };

//       checkVolume();
//     } catch (error) {
//       console.error("오디오 장치에 접근할 수 없습니다:", error);
//     }
//   }, [startSTT]); // startSTT가 변할 때만 다시 실행되도록 설정

//   useEffect(() => {
//     if (isModalOpen) {
//       startAudioProcessing(); // 모달이 열리면 자동으로 소리 감지 시작
//     }
//   }, [isModalOpen, startAudioProcessing]);

//   return (
//     <div className='backgroundImg'>
//       <button className={'round'} onClick={() => setIsModalOpen(true)}>
//         <span className="button-text">Start</span>
//       </button>
//       {isModalOpen && (
//         <div className="modal">
//           <div className="modal-content">
//             {/* 상단 부분은 그대로 유지 */}
//             <div className="modal-header">
//               {iframeChange ?
//                 <iframe title={"Video Feed"} src={isModalOpen ? "http://localhost:5000/video_feed" : ""} width={1280} height={720}></iframe>
//                 :
//                 <iframe title={"Empty Frame"} src="" width={1280} height={720}></iframe>
//               }
//               <span className="close" onClick={modalClose}>&times;</span>
//             </div>
//             {/* 하단 부분 */}
//             <div className="modal-body">
//               <div className="modal-body">
//                 {sentence ? <p>{sentence}</p> : <p>문장을 생성 중입니다...</p>}
//               </div>
//               {isListening && <p>음성 감지 중...</p>}
//               {sttText && <p>STT 결과: {sttText}</p>}
//               {keywords && <p>키워드 추출: {keywords}</p>}
//               {/* 비디오 URL이 존재하면 비디오를 표시 */}
//               {videoUrl && (
//                 <div>
//                   <video title={"Keyword Video"} width={320} height={180} controls autoPlay style={{
//                     position: 'absolute',
//                     bottom: '10px',  // 하단 10px 위치
//                     right: '10px',   // 오른쪽 10px 위치
//                     zIndex: 10,      // iframe 위에 표시되도록
//                   }}>
//                     <source src={videoUrl} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               )}
//               <button onClick={() => setIframeChange(!iframeChange)}>전환</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Translate;
