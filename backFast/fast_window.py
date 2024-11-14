import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from tensorflow.keras.models import load_model
from PIL import Image, ImageDraw, ImageFont
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from queue import Queue
import asyncio
from fastapi import WebSocket
import openai

# 새로 추가한 부분
from pydantic import BaseModel
from langchain.prompts import FewShotPromptTemplate, PromptTemplate
from langchain_community.chat_models import ChatOpenAI
import os
import requests
from typing import Optional
from konlpy.tag import Okt  # 형태소 분석을 위한 konlpy의 Okt 사용

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱의 주소 (필요하면 "*"로 설정해 모든 도메인을 허용 가능)
    allow_credentials=True,
    allow_methods=["*"],  # 허용할 HTTP 메서드 (GET, POST 등)
    allow_headers=["*"],  # 허용할 HTTP 헤더
)

model = load_model('./my_model4.h5')
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
labels = np.load("./label_classes_korean.npy")

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
    46, 53, 52, 65, 55,  # 오른 눈썹
    285, 295, 282, 283, 276,  # 왼 눈썹
    33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7,  # 오른 눈
    362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382,  # 왼 눈
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95  # 입
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

# 손이 화면에 들어왔는지 확인하는 함수 (손목 좌표가 일정 높이 이상에 있는지 확인)
def is_hand_in_frame(pose_landmarks, frame_height):
    if pose_landmarks:
        # 왼손목과 오른손목의 y 좌표 확인
        left_wrist_y = pose_landmarks[15].y * frame_height
        right_wrist_y = pose_landmarks[16].y * frame_height
        # 손이 화면에 감지되면 True 반환
        if left_wrist_y < frame_height * 0.9 or right_wrist_y < frame_height * 0.9:
            return True
    return False

# 손이 화면에서 사라졌는지 확인하는 함수 (손목 좌표가 일정 높이 아래로 내려갔는지 확인)
def is_hand_out_of_frame(pose_landmarks, frame_height):
    if pose_landmarks:
        # 왼손목과 오른손목의 y 좌표 확인
        left_wrist_y = pose_landmarks[15].y * frame_height
        right_wrist_y = pose_landmarks[16].y * frame_height
        # 손이 아래로 내려가면 True 반환
        if left_wrist_y > frame_height * 0.9 and right_wrist_y > frame_height * 0.9:
            return True
    return False

# 프레임 시퀀스를 모델 입력에 맞게 전처리하는 함수
def preprocess_sequence_for_model(frames):
    processed_frames = []
    for frame in frames:
        frame_resized = cv2.resize(frame, (224, 224))
        frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
        frame_normalized = frame_rgb.astype('float32') / 255.0
        processed_frames.append(frame_normalized)
    return np.expand_dims(np.array(processed_frames), axis=0)  # (1, sequence_length, 224, 224, 3)

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
    frames = []

    def generate_frames():
        hand_in_frame = False  # 함수 내에서 초기화
        inside_proper_position = False
        nonlocal frame_count, recording_started
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
                    if not hand_in_frame and is_hand_in_frame(holistic_results.pose_landmarks.landmark, frame_height):
                        hand_in_frame = True
                        recording_started = True  # 기록 시작
                        frames.clear()  # 프레임 리스트 초기화
                        direction_message = "손이 감지되었습니다. 시작점입니다."

                    # 기록 중이면 프레임 추가
                    if recording_started:
                        frames.append(frame)

                    # 손이 사라지거나 아래로 내려가면 끝점 기록
                    if hand_in_frame and is_hand_out_of_frame(holistic_results.pose_landmarks.landmark, frame_height):
                        hand_in_frame = False
                        recording_started = False  # 기록 종료
                        direction_message = "손이 사라졌습니다. 끝점입니다."

                        # 모델에 입력할 데이터 처리
                        input_sequence = preprocess_sequence_for_model(frames)
                        prediction = model.predict(input_sequence)

                        # 예측 결과 확인
                        predicted_label = np.argmax(prediction, axis=1)[0]
                        print(predicted_label)
                        word = labels[predicted_label]
                        result_queue.put(word)
                        print(result_queue)

                        print(f"예측된 라벨: {predicted_label}")
                        print(f"예측된 라벨값: {labels[predicted_label]}")
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
        print("WebSocket 엔드포인트에 접근함")  # 디버깅 메시지
        await websocket.accept()
        print("WebSocket 연결 수락됨")  # 디버깅 메시지

        while True:
            # result_queue에서 단어 가져오기
            if not result_queue.empty():
                # print(f"현재 큐 상태: {[item for item in result_queue.queue]}")
                print("큐 비어있지않음")
                word = result_queue.get()

                # word가 numpy.str_ 타입인 경우 일반 문자열로 변환
                if isinstance(word, np.str_):
                    word = str(word)

                sentence_buffer.append(word)
                print(f"큐에서 가져온 단어: {word}")

                # 문장 완성 조건 (예: 5개 단어 또는 "end" 단어 포함)
                if len(sentence_buffer) >= 5 or "end" in sentence_buffer:
                    print(f"버퍼에 저장된 단어: {sentence_buffer}")
                    sentence = await generate_sentence_with_gpt4(sentence_buffer)
                    print(f"생성된 문장: {sentence}")

                    # React로 문장 전송
                    await websocket.send_json({"sentence": sentence})

                    # 버퍼 초기화
                    sentence_buffer.clear()

            # 클라이언트로부터 데이터 수신 (예: ping 메시지)
            try:
                data = await websocket.receive_text()
                if data == '{"type": "ping"}':
                    continue  # 핑 메시지는 무시
            except Exception as e:
                print(f"수신 중 에러 발생: {e}")
                break  # 수신 에러 시 WebSocket 연결 종료

            # CPU 과부하 방지를 위한 짧은 대기
            await asyncio.sleep(0.1)

    except Exception as e:
        print(f"WebSocket 처리 중 예외 발생: {e}")
    finally:
        await websocket.close()
        print("WebSocket 연결 종료")