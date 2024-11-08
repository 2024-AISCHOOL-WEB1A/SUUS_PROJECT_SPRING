import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from tensorflow.keras.models import load_model
from PIL import Image, ImageDraw, ImageFont
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

model = load_model('./my_model4.h5')
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱의 주소 (필요하면 "*"로 설정해 모든 도메인을 허용 가능)
    allow_credentials=True,
    allow_methods=["*"],  # 허용할 HTTP 메서드 (GET, POST 등)
    allow_headers=["*"],  # 허용할 HTTP 헤더
)

# MediaPipe Holistic 초기화
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(min_detection_confidence=0.7, min_tracking_confidence=0.7)
mp_drawing = mp.solutions.drawing_utils

# 해상도 설정
target_width = 1280
target_height = 720

cap = None

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

# 한글 폰트 설정 (Pillow 사용)
fontpath = "fonts/gulim.ttc"  # 시스템에 설치된 한글 폰트 경로
font = ImageFont.truetype(fontpath, 32)

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
                    # 손의 좌표 화면에 표시
                    for idx in desired_pose_indices:
                        landmark = holistic_results.pose_landmarks.landmark[idx]
                        x = int(landmark.x * frame_width)
                        y = int(landmark.y * frame_height)
                        cv2.circle(frame, (x, y), 10, (0, 255, 0), -1)

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
                        predicted_label = np.argmax(prediction, axis=1)
                        print(f"모델로 전달된 프레임의 예측 라벨: {predicted_label[0]}")  # 예측 라벨 출력
                        direction_message = f"예측된 라벨: {predicted_label[0]}"
                        print(predicted_label[0])
                        print(direction_message)

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
        finally:
            cap.release()
            cv2.destroyAllWindows()
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")