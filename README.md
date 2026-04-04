# 🫀 CardioAI — Heart Attack Diagnosis Support System

AI-powered cardiac risk assessment web app built with **Vite + React** frontend and **Python Flask** backend, deployed on AWS.

---

## 🏗 Architecture

```
User (Browser)
  ↓
Amazon S3 (React Frontend)
  ↓
Amazon Cognito (JWT Auth)
  ↓
Amazon API Gateway
  ↓
Amazon EC2 (Flask + ML Model)
  ↓
Amazon DynamoDB (Prediction History)
  ↓
Amazon CloudWatch (Monitoring)
```

---

## 📁 Project Structure

```
heart-project/
├── backend/
│   ├── app.py              # Flask API
│   ├── train_model.py      # Generate heart_model.pkl
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Predict.jsx
    │   │   └── History.jsx
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   └── ResultCard.jsx
    │   ├── hooks/useAuth.jsx
    │   ├── utils/api.js
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start (Local)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python train_model.py        # generates heart_model.pkl
cp .env.example .env         # fill in AWS keys (optional)
python app.py
# → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # set VITE_API_URL=http://localhost:5000
npm run dev
# → http://localhost:3000
```

---

## 🔬 API Reference

### `POST /predict`

**Request:**
```json
{
  "features": [52, 1, 0, 125, 212, 0, 1, 168, 0, 1.0, 2, 2, 3],
  "user_id": "optional-uuid"
}
```

**Response:**
```json
{
  "user_id": "abc123",
  "risk_percentage": 72.4,
  "risk_level": "High",
  "advice": ["Consult a cardiologist immediately.", "..."],
  "timestamp": "2024-01-15T10:30:00"
}
```

### `GET /history/<user_id>`

Returns all past predictions for a user from DynamoDB.

---

## 📊 Input Features (UCI Heart Disease)

| # | Feature | Description |
|---|---------|-------------|
| 1 | age | Age in years |
| 2 | sex | 1=Male, 0=Female |
| 3 | cp | Chest pain type (0–3) |
| 4 | trestbps | Resting blood pressure (mmHg) |
| 5 | chol | Serum cholesterol (mg/dl) |
| 6 | fbs | Fasting blood sugar > 120 (0/1) |
| 7 | restecg | Resting ECG results (0–2) |
| 8 | thalach | Max heart rate achieved (bpm) |
| 9 | exang | Exercise-induced angina (0/1) |
| 10 | oldpeak | ST depression (mm) |
| 11 | slope | Slope of peak ST segment (0–2) |
| 12 | ca | # major vessels (0–3) |
| 13 | thal | Thalassemia (0–2) |

---

## ☁️ AWS Deployment

### Backend → EC2

```bash
ssh -i your-key.pem ubuntu@<EC2-IP>
sudo apt update && sudo apt install python3-pip -y
pip3 install -r requirements.txt
python3 train_model.py
python3 app.py
# Open port 5000 in Security Group
```

### Frontend → S3

```bash
cd frontend
npm run build
# Upload /dist to S3 bucket with static hosting enabled
```

### DynamoDB Table

- Table name: `HeartPredictions`
- Partition key: `user_id` (String)

---

## 🔐 Security Checklist

- [ ] Enable MFA on AWS root account
- [ ] Create IAM user (never use root)
- [ ] Attach EC2 role with DynamoDB access
- [ ] Enable AWS Shield (DDoS protection)
- [ ] Configure HTTPS via API Gateway
- [ ] Replace mock auth with AWS Cognito

---

## ⚠️ Disclaimer

This tool is for **clinical decision support only**. It does not replace professional medical diagnosis. Always consult a qualified cardiologist.
