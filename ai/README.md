# PyCharm 환경 설정 및 설치 가이드

PyCharm IDE를 기준으로, 추천 시스템 프로젝트를 개발·실행하기 위한 환경 설정 및 패키지 설치 과정

---

## 1. 시스템 요구사항

* **운영체제**: Windows, macOS, Linux
* **IDE**: PyCharm Professional 또는 Community
* **GPU**: NVIDIA GPU (CUDA 지원 필수)
* **NVIDIA 드라이버**: CUDA Toolkit 11.8 이상 호환 드라이버 (예: 525.x 이상)
* **디스크 공간**: 최소 5GB 여유 공간

---

## 2. CUDA 11.8 및 cuDNN 설치

아래 절차는 터미널(콘솔)에서 진행합니다.

1. **NVIDIA 드라이버 확인**

   ```bash
   nvidia-smi
   ```

   * 드라이버가 CUDA 11.8 이상 호환인지 확인

2. **CUDA Toolkit 11.8 설치**

   * NVIDIA 공식 페이지에서 OS에 맞는 설치 파일 다운로드:
     [https://developer.nvidia.com/cuda-11-8-0-download-archive](https://developer.nvidia.com/cuda-11-8-0-download-archive)
   * 설치 후 (Linux/macOS):

     ```bash
     export PATH=/usr/local/cuda-11.8/bin:$PATH
     export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH
     ```
   * (Windows) `%PATH%` 환경 변수에 `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin` 추가

3. **cuDNN 설치**

   * NVIDIA 개발자 계정 로그인 후 cuDNN v8.x for CUDA 11.x 다운로드
   * 압축 해제 후 CUDA 디렉터리에 라이브러리 복사

---

## 3. 패키지 설치

PyCharm 하단 터미널 또는 IDE 내 Python Console에서 아래 명령을 실행하세요:

1. **CUDA용 PyTorch 설치**

   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

2. **기타 의존성 설치**

   ```bash
   pip install -r requirements.txt
   ```

`requirements.txt` 예시:

```text
fastapi
uvicorn[standard]
SQLAlchemy
psycopg2-binary
redis
pandas
numpy
celery
```

PyCharm 환경에서 GPU 학습·추론 및 API 개발 환경
