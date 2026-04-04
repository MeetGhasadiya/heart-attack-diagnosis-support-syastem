"""
Run this script once to generate heart_model.pkl for local testing.
Uses the UCI Heart Disease dataset structure.
"""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

np.random.seed(42)

# Simulate UCI Heart Disease data
# Features: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal
n = 500
X = np.column_stack([
    np.random.randint(29, 77, n),       # age
    np.random.randint(0, 2, n),          # sex
    np.random.randint(0, 4, n),          # chest pain type
    np.random.randint(94, 200, n),       # resting BP
    np.random.randint(126, 564, n),      # cholesterol
    np.random.randint(0, 2, n),          # fasting blood sugar
    np.random.randint(0, 3, n),          # resting ECG
    np.random.randint(71, 202, n),       # max heart rate
    np.random.randint(0, 2, n),          # exercise-induced angina
    np.random.uniform(0, 6.2, n),        # ST depression
    np.random.randint(0, 3, n),          # slope
    np.random.randint(0, 4, n),          # # of vessels
    np.random.randint(0, 3, n),          # thal
])

# Simulate target with some meaningful correlation
y = (
    (X[:, 0] > 55).astype(int) +
    (X[:, 2] > 2).astype(int) +
    (X[:, 4] > 240).astype(int) +
    (X[:, 9] > 2).astype(int)
)
y = (y >= 2).astype(int)

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(n_estimators=100, random_state=42))
])

pipeline.fit(X, y)
joblib.dump(pipeline, "heart_model.pkl")
print("✅ heart_model.pkl saved successfully!")
print(f"   Training accuracy: {pipeline.score(X, y)*100:.1f}%")
