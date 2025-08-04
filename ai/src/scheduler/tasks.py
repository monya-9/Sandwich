from celery_app import app
import subprocess

@app.task
def refresh_recommendations():
    # 1) Homepage → AI DB 동기화
    subprocess.run(["python", "src/data_ingestion/homepage_to_ai.py"], check=True)
    # 2) Interactions & Features 갱신
    subprocess.run(["python", "-m", "src.feature_engineering.extract_interactions"], check=True)
    subprocess.run(["python", "-m", "src.feature_engineering.encode_user_features"], check=True)
    subprocess.run(["python", "-m", "src.feature_engineering.encode_project_features"], check=True)
    # 3) Redis ZSET 업데이트
    subprocess.run(["python", "-m", "src.model.inference"], check=True)
    return "Recommendations refreshed"

"""
# 간단한 조회 예시
recs = redis_client.zrevrange(f"recs:{user_id}", 0, -1)
# recs: [b'12',b'5',b'3',...]
recs = [int(x) for x in recs]
"""


