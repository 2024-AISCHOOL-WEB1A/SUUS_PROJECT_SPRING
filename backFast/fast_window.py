import os
import cv2
import numpy as np
import mediapipe as mp

from PIL import Image, ImageDraw, ImageFont
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from langchain.prompts import FewShotPromptTemplate, PromptTemplate
from langchain_community.chat_models import ChatOpenAI
from konlpy.tag import Okt  # 형태소 분석을 위한 konlpy의 Okt 사용
from typing import Optional

from fastapi import FastAPI
from fastapi import WebSocket, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from queue import Queue
import asyncio
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱의 주소 (필요하면 "*"로 설정해 모든 도메인을 허용 가능)
    allow_credentials=True,
    allow_methods=["*"],  # 허용할 HTTP 메서드 (GET, POST 등)
    allow_headers=["*"],  # 허용할 HTTP 헤더
)
model = load_model('./best_model_11_19ver3.h5')
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
print(model.input)
labels = np.load("./label_classes.npy", allow_pickle=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

openai_api_key = os.getenv("OPENAPI_KEY")
examples = [
        {"input": "환자, 보건소, 치료", "output": "환자는 보건소에서 치료를 받으세요."},
        {"input": "정신장애, 환자, 상담", "output": "정신장애 환자는 상담이 필요해요."},
        {"input": "구급차, 화상, 환자, 병원", "output": "구급차가 화상 환자를 병원으로 데려간다."},
        {"input": "임신, 순산, 정밀검사", "output": "임산부는 순산을 위해 정밀검사를 받으세요."},
        {"input": "환자, 금연, 결심, 회복", "output": "환자는 금연을 결심하고 회복 중이에요."},
        {"input": "피곤, 나, 보건소, 진단서", "output": "피곤한 나는 보건소에서 진단서를 받으세요."},
        {"input": "칼슘, 오줌, 부족, 이상", "output": "칼슘 부족으로 오줌이 이상했다."},
        {"input": "손, 나, 병원, 붕대", "output": "손이 다친 나는 병원에서 붕대를 받으세요."},
        {"input": "나, 몸, 통증, 보건소", "output": "나는 몸에 통증을 느끼고 보건소에 왔다."},
        {"input": "신체적장애, 치료, 병원", "output": "신체적장애인은 치료를 받기 위해 병원에 왔다."},
        {"input": "두근거리다, 전염, 검사", "output": "두근거림으로 인해 전염병 검사를 받으세요."},
        {"input": "여자, 노화, 피곤", "output": "여자는 노화로 인한 피로를 느꼈다."},
        {"input": "불면증, 식도염", "output": "불면증으로 인해 식도염이 생겼다."},
        {"input": "알겠습니다, 감사합니다", "output": "알겠습니다. 감사합니다."}
    ]

prompt = FewShotPromptTemplate(
        examples=examples,
        example_prompt=PromptTemplate.from_template("{input} → {output}"),
        input_variables=["input"],
        suffix="수어 단어를 사용하여 자연스러운 조사를 사용하여 하나의 문장으로 만들어주세요. 마지막 어미를 ~요자로 끝내서 만들어주세요. 단어의 순서는 반드시 지켜야 합니다. 결과 문장만 제공해주세요.: {input}"
    )

llm_model = ChatOpenAI(
    model_name="gpt-4o",
    temperature=0.3,
    max_tokens=200,
    model_kwargs={"top_p": 0.9},
    openai_api_key=openai_api_key
)

runnable_chain = prompt | llm_model

# MediaPipe Holistic 초기화
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
holistic = mp_holistic.Holistic(min_detection_confidence=0.7, min_tracking_confidence=0.7)

# 해상도 설정
target_width = 1280
target_height = 720

# cap 사용하기 위한 전역변수
cap = None

# 한글 폰트 설정 (Pillow 사용)
fontpath = "fonts/gulim.ttc"  # 시스템에 설치된 한글 폰트 경로
font = ImageFont.truetype(fontpath, 32)

# 포즈에서 추출하고 싶은 키포인트 인덱스 설정 (어깨, 팔꿈치, 손목, 엉덩이, 무릎, 발목)
desired_pose_indices = [15, 13, 11, 12, 14, 16]  # 원하는 포즈 키포인트 인덱스

# 얼굴에서 추출하고 싶은 키포인트 인덱스 설정
desired_face_indices = [
    33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7,
    362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382
]

# 윤곽선 그리기 함수
def draw_human_contour(frame):
    height, width = frame.shape[:2]

    # 머리 원 좌표
    head_center = (width // 2, int(height * 0.3) + 60)
    head_radius = 150

    # 몸 윤곽선
    body_contour = np.array([
        (head_center[0] - head_radius, head_center[1] + head_radius),  # 머리 왼쪽 아래
        (head_center[0] - 280, head_center[1] + 260),  # 왼쪽 어깨
        (head_center[0] - 280, height - 50),  # 왼쪽 몸 아래
        (head_center[0] + 280, height - 50),  # 오른쪽 몸 아래
        (head_center[0] + 280, head_center[1] + 260),  # 오른쪽 어깨
        (head_center[0] + head_radius, head_center[1] + head_radius)  # 머리 오른쪽 아래
    ], np.int32).reshape((-1, 1, 2))

    # 머리 원 및 몸 윤곽선 그리기
    cv2.circle(frame, head_center, head_radius, (100, 100, 100), 10)  # 머리 원
    cv2.polylines(frame, [body_contour], isClosed=False, color=(100, 100, 100), thickness=10)  # 몸 곡선

# 얼굴 전체가 윤곽선 안에 들어왔는지 확인하는 함수
def is_face_inside_contour(face_landmarks, frame_width, frame_height):
    head_center = (frame_width // 2, int(frame_height * 0.3) + 50)
    head_radius = 130

    for lm in face_landmarks:
        head_x = int(lm[0] * frame_width)  # 이미 튜플로 저장되었으므로 lm[0]을 사용
        head_y = int(lm[1] * frame_height)  # lm[1]을 사용

        # 얼굴의 각 좌표가 머리 원 안에 있는지 확인
        distance = np.sqrt((head_x - head_center[0]) ** 2 + (head_y - head_center[1]) ** 2)
        if distance > head_radius:
            return False
    return True

def are_hands_in_frame(left_hand_landmarks, right_hand_landmarks, frame_height):
    """
    양쪽 손이 화면에 있는지 확인 (왼손과 오른손의 손목 기준 - 0번째 키포인트)
    """
    try:
        left_wrist_in_frame = False
        right_wrist_in_frame = False

        # 왼손 확인
        if left_hand_landmarks and len(left_hand_landmarks.landmark) > 0:
            left_wrist_y = left_hand_landmarks.landmark[0].y * frame_height
            left_wrist_in_frame = left_wrist_y < frame_height * 0.9  # 왼손 손목이 화면 위쪽에 있으면 True

        # 오른손 확인
        if right_hand_landmarks and len(right_hand_landmarks.landmark) > 0:
            right_wrist_y = right_hand_landmarks.landmark[0].y * frame_height
            right_wrist_in_frame = right_wrist_y < frame_height * 0.9  # 오른손 손목이 화면 위쪽에 있으면 True

        # 양쪽 손이 모두 화면에 들어왔는지 반환
        return left_wrist_in_frame or right_wrist_in_frame

    except Exception as e:
        print(f"[ERROR] are_hands_in_frame 오류: {e}")
        return False

def are_hands_out_of_frame(left_hand_landmarks, right_hand_landmarks, frame_height):
    """
    양쪽 손이 화면에서 사라졌는지 확인 (왼손과 오른손의 손목 기준 - 0번째 키포인트)
    """
    try:
        left_wrist_out_of_frame = True
        right_wrist_out_of_frame = True

        # 왼손 확인
        if left_hand_landmarks and len(left_hand_landmarks.landmark) > 0:
            left_wrist_y = left_hand_landmarks.landmark[0].y * frame_height
            left_wrist_out_of_frame = left_wrist_y > frame_height * 0.9  # 왼손 손목이 화면 아래쪽에 있으면 True

        # 오른손 확인
        if right_hand_landmarks and len(right_hand_landmarks.landmark) > 0:
            right_wrist_y = right_hand_landmarks.landmark[0].y * frame_height
            right_wrist_out_of_frame = right_wrist_y > frame_height * 0.9  # 오른손 손목이 화면 아래쪽에 있으면 True

        # 양쪽 손이 모두 화면에서 나갔는지 반환
        return left_wrist_out_of_frame and right_wrist_out_of_frame

    except Exception as e:
        print(f"[ERROR] are_hands_out_of_frame 오류: {e}")
        return False

# 프레임 시퀀스를 모델 입력에 맞게 전처리하는 함수
def preprocess_sequence_for_model(frames, target_length=50, frame_size=(224, 224)):
    processed_frames = []
    idx = 0

    while len(processed_frames) < target_length:
        if idx < len(frames):
            frame = frames[idx]
            # 프레임 크기 조정 및 정규화
            frame_resized = cv2.resize(frame, frame_size)
            frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
            frame_normalized = frame_rgb.astype('float32') / 255.0
            processed_frames.append(frame_normalized)
            idx += 1
        else:
            # 부족한 경우 제로 패딩 추가
            padding_frame = np.zeros((*frame_size, 3), dtype='float32')
            processed_frames.append(padding_frame)

    # 최종 배열로 변환 및 배치 차원 추가
    return np.expand_dims(np.array(processed_frames), axis=0)  # (1, target_length, frame_size[0], frame_size[1], 3)

def preprocess_keypoints_for_model(keypoints, max_sequence_length=50, num_keypoints=80):
    # 1. 키포인트 데이터를 NumPy 배열로 변환
    keypoints = np.array(keypoints, dtype='float32')  # (프레임 수, num_keypoints, 3)

    # 2. 시퀀스 길이 조정
    current_sequence_length = keypoints.shape[0]
    if current_sequence_length > max_sequence_length:
        # 초과된 프레임은 잘라내기
        keypoints = keypoints[:max_sequence_length, :, :]
    elif current_sequence_length < max_sequence_length:
        # 부족한 프레임은 0으로 패딩
        padding = np.zeros((max_sequence_length - current_sequence_length, num_keypoints, 3), dtype='float32')
        keypoints = np.concatenate([keypoints, padding], axis=0)  # (max_sequence_length, num_keypoints, 3)

    # 3. 배치 차원 추가 (모델 입력 형태로 변환)
    keypoints = np.expand_dims(keypoints, axis=0)  # (1, max_sequence_length, num_keypoints, 3)

    return keypoints

@app.get("/")
def root():
    return "/ 페이지 입니덩"

@app.get("/shutdown")
def shutdown_event():
    global cap
    if cap and cap.isOpened():
        cap.release()  # 카메라 리소스 해제
        cv2.destroyAllWindows()  # OpenCV 창 닫기
        cap = None
    return "cap release"

@app.get("/video_feed")
def video_feed():
    global cap
    if cap is None or not cap.isOpened():
        cap = cv2.VideoCapture(0)  # 기본 카메라 열기
    frame_count = 0  # 외부 변수
    target_fps = 15
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_skip = max(1, int(fps / target_fps))  # 최소 1로 설정하여 오류 방지
    recording_started = False
    wordList=["나", "교통사고", "병원", "엑스레이", "내일", "꼭", "병원", "오다"]
    wordCnt = 0
    frames = []
    keypoints = []

    def generate_frames():
        hand_in_frame = False  # 함수 내에서 초기화
        inside_proper_position = False
        nonlocal frame_count, recording_started
        nonlocal wordCnt
        nonlocal wordList
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    print("프레임을 읽을 수 없습니다.")
                    break

                # 강제로 해상도를 1280x720으로 변경
                frame = cv2.resize(frame, (target_width, target_height))

                # 15fps로 프레임 스킵
                if frame_count % frame_skip != 0:
                    frame_count += 1
                    continue

                # 원본 비디오 프레임의 해상도 가져오기
                frame_height, frame_width = frame.shape[:2]

                # MediaPipe로 포즈 및 얼굴, 손 키포인트 추출
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                holistic_results = holistic.process(frame_rgb)

                # 기본 메시지 초기화
                direction_message = "처리 중입니다..."

                frame_coords = {
                    'pose': [[0, 0, 0]] * len(desired_pose_indices),
                    'face': [[0, 0, 0]] * len(desired_face_indices),
                    'left_hand': [[0, 0, 0]] * 21,
                    'right_hand': [[0, 0, 0]] * 21
                }

                # 얼굴 키포인트 추출
                face_landmarks = []
                if holistic_results.face_landmarks:
                    for lm in holistic_results.face_landmarks.landmark:
                        face_landmarks.append((lm.x, lm.y, lm.z))

                    # 얼굴의 모든 랜드마크가 윤곽선 안에 있는지 확인
                    if is_face_inside_contour(face_landmarks, frame_width, frame_height):
                        inside_proper_position = True
                        direction_message = "적절한 위치입니다"
                    else:
                        inside_proper_position = False
                        direction_message = "윤곽선 안으로 이동하세요"

                # 적절한 위치에 있지 않을 때 윤곽선 그리기
                if not inside_proper_position:
                    draw_human_contour(frame)

                # 적절한 위치에 들어왔을 때 손의 좌표 확인 및 시작점 설정
                if inside_proper_position and holistic_results.pose_landmarks:

                    # 손이 감지되면 시작점 기록
                    if not hand_in_frame and are_hands_in_frame(holistic_results.left_hand_landmarks, holistic_results.right_hand_landmarks, frame_height):
                        hand_in_frame = True
                        recording_started = True  # 기록 시작
                        frames.clear()  # 프레임 리스트 초기화
                        direction_message = "손이 감지되었습니다. 시작점입니다."

                    # 기록 중이면 프레임 추가
                    if recording_started:
                        # Pose landmarks
                        if holistic_results.pose_landmarks:
                            frame_coords['pose'] = [
                                [lm.x, lm.y, lm.z] for idx, lm in enumerate(holistic_results.pose_landmarks.landmark) if idx in desired_pose_indices
                            ]

                        # Face landmarks
                        if holistic_results.face_landmarks:
                            frame_coords['face'] = [
                                [lm.x, lm.y, lm.z] for idx, lm in enumerate(holistic_results.face_landmarks.landmark) if idx in desired_face_indices
                            ]

                        # Left hand landmarks
                        if holistic_results.left_hand_landmarks:
                            frame_coords['left_hand'] = [[lm.x, lm.y, lm.z] for lm in holistic_results.left_hand_landmarks.landmark]

                        # Right hand landmarks
                        if holistic_results.right_hand_landmarks:
                            frame_coords['right_hand'] = [[lm.x, lm.y, lm.z] for lm in holistic_results.right_hand_landmarks.landmark]

                        keypoints.append(frame_coords['pose']+frame_coords['face']+frame_coords['left_hand']+frame_coords['right_hand'])
                        frames.append(frame)

                    # 손이 사라지거나 아래로 내려가면 끝점 기록
                    if hand_in_frame and are_hands_out_of_frame(holistic_results.left_hand_landmarks, holistic_results.right_hand_landmarks, frame_height):
                        hand_in_frame = False
                        recording_started = False  # 기록 종료
                        direction_message = "손이 사라졌습니다. 끝점입니다."

                        # 모델에 입력할 데이터 처리 =============================================> 변경 부분
                        input_sequence = preprocess_sequence_for_model(frames)
                        processed_keypoints = preprocess_keypoints_for_model(keypoints)
                        prediction = model.predict([input_sequence,processed_keypoints])

                        # 예측 결과 확인
                        predicted_label = np.argmax(prediction, axis=1)[0]
                        word = labels[predicted_label]
                        result_queue.put(word)

                        print(f"예측된 라벨: {predicted_label}")
                        print(f"예측된 라벨값: {word}")
                        # ===============================================================================

                        # result_queue.put(wordList[wordCnt])
                        # wordCnt += 1
                        # if wordCnt == len(wordList):  # wordList 끝까지 반복
                        #     wordCnt = 0

                        # ===============================================================================
                        frames.clear()  # 시퀀스 전달 후 리스트 초기화

                # 한글 메시지를 화면에 표시
                frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                draw = ImageDraw.Draw(frame_pil)
                draw.text((50, 50), direction_message, font=font, fill=(255, 0, 0))  # 한글 메시지 출력
                frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
                _, buffer = cv2.imencode('.jpg', frame)

                yield (b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                frame_count += 1
        except Exception as e:
            print(f"스트림 처리 중 오류 발생: {e}")
        finally:
            cap.release()
            cv2.destroyAllWindows()
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")
# ============================================================================================================================
result_queue = Queue()
sentence_buffer = []  # 단어를 모아둘 버퍼
# GPT-4 호출 함수
async def generate_sentence_with_gpt4(words):
    """
    GPT-4 API를 호출하여 입력 단어로 문장을 생성합니다.
    """
    try:
        # 입력이 리스트인 경우 문자열로 변환
        if isinstance(words, list):
            words = ", ".join(words)

        # RunnableSequence를 사용하여 실행
        response = runnable_chain.invoke({"input": words})

        # 반환된 값이 numpy.str_ 타입일 수 있으므로 str()로 변환
        return str(response.content).strip() if response else "문장을 생성할 수 없습니다."
    except Exception as e:
        # 예외 처리 및 로그 출력
        print(f"GPT-4 호출 중 에러 발생: {e}")
        return "문장 생성 중 오류가 발생했습니다."

@app.websocket("/ws/prediction")
async def prediction_websocket(websocket: WebSocket):
    try:
        await websocket.accept()
        while True:
            while not result_queue.empty():
                word = result_queue.get()

                # word가 numpy.str_ 타입인 경우 문자열로 변환
                if isinstance(word, np.str_):
                    word = str(word)

                sentence_buffer.append(word)
                print(f"버퍼에 저장된 단어: {sentence_buffer}")

                # 5개 이상의 단어가 쌓이면 문장 생성
                if len(sentence_buffer) >= 4:
                    sentence = await generate_sentence_with_gpt4(sentence_buffer)
                    print(f"생성된 문장: {sentence}")

                    # React로 전송
                    await websocket.send_json({"sentence": sentence})

                    # 버퍼 초기화
                    sentence_buffer.clear()

            # 핑 메시지를 기다리지 않더라도 작동하도록 대기 추가
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                if data == '{"type": "ping"}':
                    continue  # 핑 메시지는 무시
            except asyncio.TimeoutError:
                # 타임아웃 발생 시 아무 작업도 하지 않음 (큐 확인 루프 계속)
                pass
            except Exception as e:
                print(f"클라이언트 데이터 수신 중 에러 발생: {e}")
                break  # 수신 에러 시 WebSocket 종료

            # CPU 과부하 방지를 위한 짧은 대기
            await asyncio.sleep(0.1)

    except Exception as e:
        print(f"WebSocket 처리 중 예외 발생: {e}")
    finally:
        await websocket.close()
        print("WebSocket 연결 종료")

# ===============================================================================================================================
# 요청 모델 정의
# 형태소 분석을 통한 전처리 함수
def preprocess_sentence(sentence: str):
    okt = Okt()
    tokens = okt.pos(sentence)
    # 조사(Josa), 어미(Eomi), 구두점(Punctuation) 제거
    meaningful_words = [word for word, tag in tokens if tag not in ['Josa', 'Eomi', 'Punctuation']]
    return meaningful_words

# 요청 데이터 모델 정의
class SentenceRequest(BaseModel):
    sentence: str

# gpt-4o API 호출 함수
def call_gpt4o_api(text: str) -> Optional[str]:
    api_url = "https://api.openai.com/v1/chat/completions"

    headers = {
        'Authorization': f'Bearer {openai_api_key}',
        'Content-Type': 'application/json'
    }

    prompt = f"다음 문장에서 핵심 단어를 추출하는데, 의미를 유지해야 하는 단어('가다', '감사합니다', '검사', '나빠지다', '병원, '소화불량, '아프다', '안녕하세요', '왔어요', '조회', '죄송합니다', '치료', '호명', '확인서', '환자실', '회복') 는 그대로 유지해줘. 결과는 쉼표로 구분된 단어 리스트로 출력해줘. 단어의 띄어쓰기는 모두 제거해줘: {text}"
    payload = {
        'model': 'gpt-4o',
        'messages': [
            {'role': 'user', 'content': prompt}
        ]
    }

    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()

        # 응답 데이터 파싱
        response_data = response.json()
        if 'choices' in response_data and len(response_data['choices']) > 0:
            processed_text = response_data['choices'][0]['message']['content']
            return processed_text.strip()
        else:
            print("API 응답에서 예상된 데이터 구조를 찾을 수 없습니다.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"GPT-4o API 요청 오류: {e}")
        return None

# FastAPI 엔드포인트 설정 => 
@app.post("/extract_keywords")
async def extract_keywords(data: SentenceRequest):
    try:
        # 전처리한 문장 토큰 목록 생성
        preprocessed_text = " ".join(preprocess_sentence(data.sentence))
        print("전처리한 문장 토큰: ", preprocessed_text)
        gpt4o_response = call_gpt4o_api(preprocessed_text)
        if gpt4o_response:
            return {"keywords": gpt4o_response}
        else:
            raise HTTPException(status_code=500, detail="GPT-4o API 요청 실패")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"오류 발생: {str(e)}")