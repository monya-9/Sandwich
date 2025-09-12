import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

# 1) data 폴더 생성
os.makedirs('data', exist_ok=True)

# 2) interactions 예시 데이터 생성
num_users = 10
num_projects = 15
records = []
for u in range(num_users):
    for _ in range(random.randint(5, 12)):
        p = random.randint(0, num_projects - 1)
        w = random.choices([1, 3, 5], weights=[0.5, 0.3, 0.2])[0]
        ts = datetime.now() - timedelta(days=random.randint(0, 9), hours=random.randint(0, 23))
        records.append({'user_id': u, 'project_id': p, 'weight': w, 'timestamp': ts})
interactions_df = pd.DataFrame(records)
interactions_df.to_csv('data/interactions.csv', index=False)

# 3) user_skills.npy 생성
user_skills = np.random.rand(num_users, 10)
np.save('data/user_skills.npy', user_skills)

# 4) project_tools.npy 생성
project_tools = np.random.rand(num_projects, 20)
np.save('data/project_tools.npy', project_tools)

print("Dummy data generated:")
print(" - data/interactions.csv", interactions_df.shape)
print(" - data/user_skills.npy", user_skills.shape)
print(" - data/project_tools.npy", project_tools.shape)
