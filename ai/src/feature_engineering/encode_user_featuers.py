import numpy as np
import pandas as pd
import json
from ai.src.utils.db import get_db

def main():
    db = next(get_db())
    users = pd.read_sql(
        "SELECT u.user_id, p.skills FROM users u JOIN profiles p ON u.user_id=p.user_id",
        db.bind
    )

    def encode(skills_json):
        arr = json.loads(skills_json or "[]")
        vec = np.zeros(10)
        for i, s in enumerate(arr[:10]):
            vec[i] = (hash(s) % 100) / 100
        return vec

    feats = np.stack(users.skills.apply(encode).values)
    np.save("data/user_skills.npy", feats)
    print("user_skills.npy 생성:", feats.shape)

if __name__ == "__main__":
    main()
