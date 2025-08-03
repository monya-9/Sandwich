import pandas as pd
from ai.src.utils.db import get_db
from sqlalchemy import text

def main():
    db = next(get_db())
    sql = """
    SELECT user_id, project_id,
           3 AS weight,
           created_at AS timestamp
      FROM likes
    UNION ALL
    SELECT user_id, project_id,
           5 AS weight,
           created_at AS timestamp
      FROM comments;
    """
    df = pd.read_sql(text(sql), db.bind)
    df.to_csv("data/interactions.csv", index=False)
    print("interactions.csv 생성:", df.shape)

if __name__ == "__main__":
    main()
