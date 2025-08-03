from celery_app import app
import subprocess

@app.task
def run_all():
    subprocess.run(["python", "generate_dummy_data.py"])
    subprocess.run(["python", "-m", "src.feature_engineering.extract_interactions"])
    subprocess.run(["python", "-m", "src.feature_engineering.encode_user_features"])
    subprocess.run(["python", "-m", "src.feature_engineering.encode_project_features"])
    subprocess.run(["python", "-m", "src.model.inference"])
    return "done"
