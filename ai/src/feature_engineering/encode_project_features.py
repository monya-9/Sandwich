import numpy as np
import pandas as pd
import json
from ai.src.utils.db import get_db

def main():
    db = next(get_db())
    sql = """
    SELECT pr.project_id,
           pr.tools      AS tools,
           array_agg(h.hashtag) AS hashtags
      FROM projects pr
      LEFT JOIN hashtags h ON pr.project_id=h.project_id
     GROUP BY pr.project_id, pr.tools;
    """
    df = pd.read_sql(sql, db.bind)

    def encode(field_json):
        arr = json.loads(field_json or "[]")
        vec = np.zeros(10)
        for i, s in enumerate(arr[:10]):
            vec[i] = (hash(s) % 100) / 100
        return vec

    tool_vecs = df.tools.apply(encode)
    tag_vecs  = df.hashtags.apply(lambda arr: encode(json.dumps(arr)))
    feats = np.stack([np.concatenate([t, g]) for t, g in zip(tool_vecs, tag_vecs)])
    np.save("data/project_tools.npy", feats)
    print("project_tools.npy 생성:", feats.shape)

if __name__ == "__main__":
    main()
