from fastapi import FastAPI, HTTPException
import traceback
from ai.src.utils.redis import redis_client

app = FastAPI(title="Project Recommendation API")

@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: int, k: int = 10):
    key = f"recs:{user_id}"
    try:
        if not redis_client.ping():
            raise ConnectionError("Redis 연결 실패")

        if not redis_client.exists(key):
            raise HTTPException(status_code=404, detail="추천 데이터 없음")

        stored = redis_client.lrange(key, 0, k-1)
        recs = [int(x) for x in stored]
        return {"user_id": user_id, "recommendations": recs}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
