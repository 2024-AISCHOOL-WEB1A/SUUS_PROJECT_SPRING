import React, { useState, useEffect, useCallback } from 'react';
import '../css/Translate.css';
import instance from '../axios';
import { useDispatch, useSelector } from "react-redux";
import { usageActions } from '../redux/reducer/usageSlice';
import '../css/Translate.css';

const Translate = () => {
  const dispatch = useDispatch()
  const { isModalOpen } = useSelector((state) => state.usage)   //모달여부 state
  const [iframeChange, setIframeChange] = useState(false)       //전환여부 state

  const [sttTextList, setSttTextList] = useState("")            // STT 결과를 배열로 저장
  const [keywordsList, setKeywordsList] = useState([])          // 키워드 추출 결과를 배열로 저장
  const [isListening, setIsListening] = useState(false)         // 음성 인식 중인지 여부 상태
  const [videoSrc, setVideoSrc] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)           // 현재 재생 중인 키워드의 인덱스

  const openModal = () => {
    dispatch(usageActions.openModal())
  };

  const modalClose = async () => {
    dispatch(usageActions.closeModal())
    setSttTextList()           // STT 결과 초기화
    setKeywordsList([])        // 키워드 초기화
    setVideoSrc("")            // 비디오 소스 초기화
    setCurrentIndex(0)
    try {
      await instance.get("http://localhost:5000/shutdown")
    } catch (e) {
      console.error(e)
    }
  };
  // 수어 번역이후 TTS
  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    window.speechSynthesis.speak(utterance)
  }

  const startSTT = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("STT 기능이 지원되지 않는 브라우저입니다.")
      return
    }

    const recognition = new window.webkitSpeechRecognition()
    recognition.lang = "ko-KR"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      console.log(transcript)
      setSttTextList(transcript)

      try {
        const res = await instance.post("http://localhost:5000/extract_keywords", { sentence: transcript })
        let newKeywords = res.data.keywords

        // newKeywords가 배열이 아닌 문자열일 경우 쉼표로 분리하여 배열로 변환
        if (typeof newKeywords === "string") {
          newKeywords = newKeywords
            .split(",") // 쉼표로 나눔
            .map(keyword => keyword.trim()) // 공백 제거 후 URL 인코딩
        }

        setKeywordsList(newKeywords)
      } catch (error) {
        console.error("Error extracting keywords:", error)
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        console.error("STT 오류:", event.error)
      }
    }

    recognition.onspeechend = () => {
      recognition.stop()
      setIsListening(false)
    }

    recognition.start()
  }, [])

  const startAudioProcessing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const microphone = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      microphone.connect(analyser)

      const dataArray = new Uint8Array(analyser.fftSize)
      let isListeningLocal = false

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray)
        const sum = dataArray.reduce((a, b) => a + b, 0)
        const volume = sum / dataArray.length

        if (volume > 20 && !isListeningLocal) {
          isListeningLocal = true
          setIsListening(true)
          startSTT()
        } else if (volume <= 10 && isListeningLocal) {
          isListeningLocal = false
          setIsListening(false)
        }

        requestAnimationFrame(checkVolume)
      }

      checkVolume()
    } catch (error) {
      console.error("오디오 장치에 접근할 수 없습니다:", error)
    }
  }, [startSTT])

  useEffect(() => {
    if (isModalOpen) {
      startAudioProcessing()
    }
  }, [isModalOpen, startAudioProcessing])

  // 키워드 목록에서 비디오 파일이 있는지 확인 및 순차 재생

  const videoMapping = {
    "가다": "Go",
    "감사합니다": "ThankYou",
    "검사": "MedicalTest",
    "나빠지다": "Worsen",
    "병원": "Hospital",
    "소화불량": "Indigestion",
    "아프다": "BeSick",
    "안녕하세요": "Hello",
    "왔어요": "Come",
    "조회": "Lookup",
    "죄송합니다": "Sorry",
    "치료": "Treatment",
    "호명": "Calling",
    "확인서": "Certificate",
    "환자실": "PatientRoom",
    "회복": "Recovery"
  }

  const filterKeywords = (list, mapping) => list.filter(keyword => mapping[keyword])

  useEffect(() => {
    if (!keywordsList.length) {
      console.warn("Keywords list is empty.")
      return
    }

    // 매핑되지 않는 키워드를 제외한 새로운 리스트 생성
    const filteredKeywords = filterKeywords(keywordsList, videoMapping)
    console.log("필터된 키워드", filteredKeywords)
    // `keywordsList`가 변경될 경우만 실행
    if (!filteredKeywords.length || currentIndex >= filteredKeywords.length) {
      console.warn("No valid keywords or index out of range.")
      return
    }

    const currentKeyword = filteredKeywords[currentIndex]
    const mappedValue = videoMapping[currentKeyword]

    if (mappedValue) {
      // 동적으로 매핑된 값으로 URL 생성
      setVideoSrc(`https://suus-bucket.s3.ap-northeast-2.amazonaws.com/${mappedValue}.mp4`)
    } else {
      console.error(`Mapping for "${currentKeyword}" not found.`)
    }

  }, [keywordsList, currentIndex])

  // 비디오가 끝날 때마다 다음 키워드의 비디오를 재생
  const handleVideoEnd = () => {
    if (currentIndex < keywordsList.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1)
    } else {
      handleClearText()
    }
  }

  // 전환 버튼 클릭 시 문장과 단어 모두 초기화
  const handleClearText = () => {
    setSttTextList()           // STT 결과 초기화
    setKeywordsList([])        // 키워드 초기화
    setVideoSrc("")            // 비디오 소스 초기화
    setCurrentIndex(0);        // 키워드 인덱스 초기화
  };

  useEffect(() => {
    let ws           // WebSocket 객체
    let pingInterval // 핑 메시지를 위한 인터벌

    // WebSocket 이벤트 핸들러 정의
    const handleOpen = () => {
      console.log("WebSocket 연결 성공")
    }

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // 수신된 문장을 상태에 추가
        if (data.sentence) {
          speakText(data.sentence)
        }
      } catch (error) {
        console.error("JSON 파싱 에러:", error)
      }
    };

    const handleError = (error) => {
      console.error("WebSocket 에러 발생:", error.message || error)
    };

    const handleClose = (event) => {
      clearInterval(pingInterval) // WebSocket 종료 시 인터벌 제거

      if (event.code !== 1000) {
        setTimeout(() => {
          initializeWebSocket() // 재연결
        }, 1000);
      }
    };

    const initializeWebSocket = () => {
      ws = new WebSocket("ws://localhost:5000/ws/prediction")
      ws.onopen = handleOpen
      ws.onmessage = handleMessage
      ws.onerror = handleError
      ws.onclose = handleClose
    }

    if (isModalOpen) {
      initializeWebSocket() // 모달 열릴 때 WebSocket 초기화
    }

    return () => {
      // 모달이 닫힐 때 WebSocket 및 인터벌 정리
      if (ws) ws.close()
      clearInterval(pingInterval)
    }
  }, [isModalOpen])

  return (
    <div className="backgroundImg">
      <img src="/imgs/blur-hospital.jpg" alt="" className="backgroundImage" />
      <img src="/imgs/hello.gif" alt="Animation" className="gif-animation" />
      <span className="texttitle">수어 번역을 시작하기 위해서 버튼을 눌러주세요</span>

      <button className="round" onClick={openModal}>
        <span className="button-text">시작하기</span>
      </button>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              {iframeChange ?
                <iframe title="Video Feed" className="no-scroll-iframe" src={iframeChange ? "http://localhost:5000/video_feed" : ""} width={1280} height={720}></iframe>
                :
                <video src={videoSrc} width={1280} height={720} autoPlay onEnded={handleVideoEnd}></video>
              }
              <span className="close" onClick={modalClose}>&times;</span>
            </div>
            {iframeChange ?
              <div className="modal-body">
                <p>수어를 녹화 중 입니다.</p>
                <button onClick={() => {
                  setIframeChange(!iframeChange)
                  handleClearText()
                }} className='changebtn'>전환</button>
              </div>
              :
              <div className="modal-body">
                {sttTextList ? <p>{sttTextList}</p> : isListening ? <p>음성 감지 중...</p> : <p>마이크를 켜고 말해주세요.</p>}
                <button onClick={() => {
                  setIframeChange(!iframeChange)
                  handleClearText()
                }} className='changebtn'>전환</button>
              </div>
            }

          </div>
        </div>
      )}
    </div>
  )
}

export default Translate