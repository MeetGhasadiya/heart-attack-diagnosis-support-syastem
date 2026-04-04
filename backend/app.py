from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import boto3
import uuid
import os
import hmac
import hashlib
import base64
from datetime import datetime
from dotenv import load_dotenv
from botocore.exceptions import ClientError

load_dotenv()

app = Flask(__name__)
CORS(app)

# ✅ AWS CONFIGURATION
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
COGNITO_CLIENT_ID = os.getenv('APP_CLIENT_ID')
COGNITO_CLIENT_SECRET = os.getenv('APP_CLIENT_SECRET')
USER_POOL_ID = os.getenv('USER_POOL_ID')
DYNAMODB_TABLE_USERS = os.getenv('DYNAMODB_TABLE', 'user-table')
DYNAMODB_TABLE_PREDICTIONS = 'HeartPredictions'

# ✅ COGNITO SECRET HASH FUNCTION
def get_secret_hash(username):
    """Compute HMAC-SHA256 for Cognito when client has a secret."""
    if not COGNITO_CLIENT_SECRET:
        return None
    
    message = bytes(username + COGNITO_CLIENT_ID, 'utf-8')
    secret = bytes(COGNITO_CLIENT_SECRET, 'utf-8')
    dig = hmac.new(secret, msg=message, digestmod=hashlib.sha256).digest()
    return base64.b64encode(dig).decode()

# ✅ INITIALIZE AWS CLIENTS
cognito = boto3.client('cognito-idp', region_name=AWS_REGION)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)

def get_users_table():
    try:
        return dynamodb.Table(DYNAMODB_TABLE_USERS)
    except Exception as e:
        print(f"❌ User table error: {e}")
        return None

def get_predictions_table():
    try:
        return dynamodb.Table(DYNAMODB_TABLE_PREDICTIONS)
    except Exception as e:
        print(f"❌ Predictions table error: {e}")
        return None

# Load ML model
try:
    model = joblib.load("heart_model.pkl")
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"⚠️  Model not found: {e}. Using mock predictor.")
    model = None


def get_risk_advice(risk_level, risk_pct):
    """Medical rule engine — returns risk-based advice."""
    advice = []
    if risk_level == "High":
        advice = [
            "Consult a cardiologist immediately.",
            "Avoid strenuous physical activity until evaluated.",
            "Monitor blood pressure daily.",
            "Reduce sodium intake significantly.",
            "Take prescribed medications regularly."
        ]
    elif risk_level == "Medium":
        advice = [
            "Schedule a check-up with your doctor within 2 weeks.",
            "Adopt a heart-healthy diet (low fat, high fiber).",
            "Exercise moderately: 30 min walk daily.",
            "Quit smoking if applicable.",
            "Manage stress through meditation or yoga."
        ]
    else:
        advice = [
            "Maintain your current healthy lifestyle.",
            "Continue regular exercise (150 min/week).",
            "Annual cardiac check-up recommended.",
            "Stay hydrated and maintain healthy weight.",
            "Routine blood work every 6 months."
        ]
    return advice


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "Heart Attack Diagnosis API is running ✅", "version": "1.0.0"})


# ============================================
# 🔐 AUTHENTICATION ENDPOINTS
# ============================================

@app.route("/register", methods=["POST"])
def register():
    """Register a new user with Cognito and save to DynamoDB."""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        name = data.get("name", "").strip()

        if not email or not password or not name:
            return jsonify({"error": "Email, password, and name are required"}), 400

        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        # Step 1: Register in Cognito
        print(f"📝 Registering user: {email}")
        response = cognito.sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            Password=password,
            SecretHash=get_secret_hash(email),
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "name", "Value": name}
            ]
        )

        user_id = response["UserSub"]
        print(f"✅ Cognito signup successful. UserSub: {user_id}")

        # Step 2: Save to DynamoDB
        users_table = get_users_table()
        if users_table:
            users_table.put_item(Item={
                "user_id": user_id,
                "email": email,
                "name": name,
                "created_at": datetime.utcnow().isoformat()
            })
            print(f"✅ User saved to DynamoDB: {email}")

        return jsonify({
            "message": "User registered successfully. Please confirm your email.",
            "user_id": user_id,
            "email": email
        }), 201

    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        print(f"❌ Cognito error: {error_code} - {error_msg}")
        return jsonify({"error": error_msg}), 400
    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/confirm-signup", methods=["POST"])
def confirm_signup():
    """Confirm user registration with code sent to email."""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        code = data.get("code", "").strip()

        if not email or not code:
            return jsonify({"error": "Email and confirmation code are required"}), 400

        print(f"✅ Confirming signup for: {email}")
        cognito.confirm_sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            ConfirmationCode=code,
            SecretHash=get_secret_hash(email)
        )

        print(f"✅ Email confirmed: {email}")
        return jsonify({
            "message": "Email confirmed successfully. You can now sign in."
        }), 200

    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        print(f"❌ Confirmation error: {error_code} - {error_msg}")
        return jsonify({"error": error_msg}), 400
    except Exception as e:
        print(f"❌ Confirmation error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/login", methods=["POST"])
def login():
    """Authenticate user with Cognito."""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        print(f"🔓 Login attempt: {email}")
        response = cognito.initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": email,
                "PASSWORD": password,
                "SECRET_HASH": get_secret_hash(email)
            }
        )

        auth_result = response["AuthenticationResult"]
        print(f"✅ Login successful: {email}")

        return jsonify({
            "message": "Login successful",
            "access_token": auth_result["AccessToken"],
            "id_token": auth_result["IdToken"],
            "refresh_token": auth_result["RefreshToken"]
        }), 200

    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        print(f"❌ Login error: {error_code} - {error_msg}")
        return jsonify({"error": error_msg}), 401
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return jsonify({"error": str(e)}), 500
        return jsonify({"error": str(e)}), 500


@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Initiate forgot password flow - sends OTP to email."""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()

        if not email:
            return jsonify({"error": "Email is required"}), 400

        print(f"📧 Forgot password request: {email}")
        cognito.forgot_password(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            SecretHash=get_secret_hash(email)
        )

        print(f"✅ OTP sent to: {email}")
        return jsonify({
            "message": "OTP sent to your email address"
        }), 200

    except ClientError as e:
        error_msg = e.response['Error']['Message']
        print(f"❌ Forgot password error: {error_msg}")
        return jsonify({"error": error_msg}), 400
    except Exception as e:
        print(f"❌ Forgot password error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/confirm-password", methods=["POST"])
def confirm_password():
    """Confirm new password with OTP code."""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        code = data.get("code", "").strip()
        new_password = data.get("new_password", "").strip()

        if not email or not code or not new_password:
            return jsonify({"error": "Email, OTP code, and new password are required"}), 400

        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        print(f"🔑 Password reset for: {email}")
        cognito.confirm_forgot_password(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            ConfirmationCode=code,
            Password=new_password,
            SecretHash=get_secret_hash(email)
        )

        print(f"✅ Password reset successful: {email}")
        return jsonify({
            "message": "Password reset successful. You can now sign in."
        }), 200

    except ClientError as e:
        error_msg = e.response['Error']['Message']
        print(f"❌ Password reset error: {error_msg}")
        return jsonify({"error": error_msg}), 400
    except Exception as e:
        print(f"❌ Password reset error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ============================================
# 🏥 HEART PREDICTION ENDPOINTS
# ============================================

@app.route("/predict", methods=["POST"])
def predict():
    try:
        body = request.get_json()
        if not body or "features" not in body:
            return jsonify({"error": "Missing 'features' in request body"}), 400

        features = body["features"]
        user_id = body.get("user_id", str(uuid.uuid4()))

        if len(features) != 13:
            return jsonify({"error": f"Expected 13 features, got {len(features)}"}), 400

        arr = np.array(features, dtype=float).reshape(1, -1)

        if model:
            prediction = model.predict_proba(arr)[0][1]
        else:
            # Mock prediction for testing without trained model
            prediction = float(np.clip(np.sum(arr) / 1000, 0.05, 0.95))

        risk_pct = round(float(prediction * 100), 2)

        if prediction > 0.7:
            risk_level = "High"
        elif prediction > 0.4:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        advice = get_risk_advice(risk_level, risk_pct)

        result = {
            "user_id": user_id,
            "risk_percentage": risk_pct,
            "risk_level": risk_level,
            "advice": advice,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Save to DynamoDB (if configured)
        table = get_predictions_table()
        if table:
            try:
                table.put_item(Item={
                    "user_id": user_id,
                    "prediction_id": str(uuid.uuid4()),
                    "risk_level": risk_level,
                    "risk_percentage": str(risk_pct),
                    "features": str(features),
                    "timestamp": result["timestamp"]
                })
            except Exception as e:
                print(f"DynamoDB save failed: {e}")

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/history/<user_id>", methods=["GET"])
def get_history(user_id):
    """Fetch prediction history for a user from DynamoDB."""
    try:
        table = get_predictions_table()
        if not table:
            return jsonify({"history": [], "message": "DynamoDB predictions table not configured"}), 200

        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(user_id)
        )
        return jsonify({"history": response.get("Items", [])})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Starting CardioAI backend on port {port}")
    print(f"📍 Cognito User Pool: {USER_POOL_ID}")
    print(f"📍 AWS Region: {AWS_REGION}")
    app.run(host="0.0.0.0", port=port, debug=True)
