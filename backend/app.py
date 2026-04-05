from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import boto3
import uuid
import os
import json
import base64
import hmac
import hashlib
import logging
from datetime import datetime
from dotenv import load_dotenv
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

load_dotenv()

app = Flask(__name__)
CORS(app)

LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend.log")
logger = logging.getLogger("cardioai")
logger.setLevel(logging.INFO)
if not logger.handlers:
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)
    logger.addHandler(file_handler)


@app.before_request
def log_request_start():
    logger.info("%s %s from %s", request.method, request.path, request.remote_addr)


@app.after_request
def log_request_end(response):
    logger.info("%s %s -> %s", request.method, request.path, response.status_code)
    return response

SERVER_PID = os.getpid()
SERVER_INSTANCE = f"pid-{SERVER_PID}"

# ✅ AWS CONFIGURATION
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
COGNITO_CLIENT_ID = os.getenv('APP_CLIENT_ID')
COGNITO_CLIENT_SECRET = os.getenv('APP_CLIENT_SECRET')
USER_POOL_ID = os.getenv('USER_POOL_ID')
DYNAMODB_TABLE_USERS = os.getenv('DYNAMODB_TABLE', 'user-table')
DYNAMODB_TABLE_PREDICTIONS = 'heart-ai-data'

# ✅ COGNITO SECRET HASH FUNCTION
def get_secret_hash(username):
    """Compute HMAC-SHA256 for Cognito when client has a secret."""
    if not COGNITO_CLIENT_SECRET:
        return None
    
    message = bytes(username + COGNITO_CLIENT_ID, 'utf-8')
    secret = bytes(COGNITO_CLIENT_SECRET, 'utf-8')
    dig = hmac.new(secret, msg=message, digestmod=hashlib.sha256).digest()
    return base64.b64encode(dig).decode()


def verify_token(token):
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        payload_part = parts[1]
        padding = "=" * (-len(payload_part) % 4)
        decoded = base64.urlsafe_b64decode(payload_part + padding)
        return json.loads(decoded.decode("utf-8"))
    except Exception:
        return None

# ✅ INITIALIZE AWS CLIENTS
cognito = boto3.client('cognito-idp', region_name=AWS_REGION)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)

def get_users_table():
    try:
        return dynamodb.Table(DYNAMODB_TABLE_USERS)
    except Exception as e:
        logger.exception("❌ User table error: %s", e)
        return None

def get_predictions_table():
    try:
        return dynamodb.Table(DYNAMODB_TABLE_PREDICTIONS)
    except Exception as e:
        logger.exception("❌ Predictions table error: %s", e)
        return None

# Load ML model
model = None
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "heart_model.pkl")
logger.info("📂 Looking for model at: %s", model_path)
try:
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        logger.info("✅ Model loaded successfully from %s", model_path)
    else:
        logger.warning("⚠️  Model file not found at %s", model_path)
        logger.warning("⚠️  Files in directory: %s", os.listdir(os.path.dirname(model_path)))
except Exception as e:
    logger.exception("⚠️  Model loading error: %s. Using mock predictor.", e)
    model = None

MODEL_STATUS = {
    "loaded": model is not None,
    "source": "heart_model.pkl" if model is not None else "mock",
    "path": model_path,
    "class_name": type(model).__name__ if model is not None else None,
    "expected_features": getattr(model, "n_features_in_", None) if model is not None else None,
}


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
    logger.info("Health check requested")
    return jsonify({
        "status": "Heart Attack Diagnosis API is running ✅", 
        "version": "1.0.0",
        "server_pid": SERVER_PID,
        "server_instance": SERVER_INSTANCE,
        "model_loaded": MODEL_STATUS["loaded"],
        "model_source": MODEL_STATUS["source"],
        "model_class": MODEL_STATUS["class_name"],
        "model_expected_features": MODEL_STATUS["expected_features"],
        "model_path": MODEL_STATUS["path"] if MODEL_STATUS["loaded"] else "Not loaded",
        "dynamodb_table": DYNAMODB_TABLE_PREDICTIONS,
        "aws_region": AWS_REGION
    })


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
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "No token"}), 401

        token = auth_header.replace("Bearer ", "")
        user = verify_token(token)

        if not user:
            return jsonify({"error": "Invalid token"}), 401

        body = request.get_json()
        if not body or "features" not in body:
            return jsonify({"error": "Missing 'features' in request body"}), 400

        features = body["features"]
        user_id = user["sub"]

        if len(features) != 13:
            return jsonify({"error": f"Expected 13 features, got {len(features)}"}), 400

        logger.info("🔍 PREDICTION REQUEST: user_id=%s features=%s", user_id, features)

        arr = np.array(features, dtype=float).reshape(1, -1)

        model_expected = getattr(model, "n_features_in_", None) if model is not None else None
        if model is not None and model_expected is not None and model_expected != arr.shape[1]:
            logger.error(
                "❌ Model feature mismatch: model expects %s but request has %s",
                model_expected,
                arr.shape[1],
            )
            return jsonify({
                "error": f"Model expects {model_expected} features, but request sent {arr.shape[1]}.",
                "_debug": {
                    "server_pid": SERVER_PID,
                    "server_instance": SERVER_INSTANCE,
                    "model_loaded": True,
                    "model_class": type(model).__name__,
                    "model_expected_features": model_expected,
                    "request_features": arr.shape[1],
                    "hint": "Regenerate heart_model.pkl with backend/train_model.py (13 features)."
                }
            }), 400

        if model:
            logger.info("🤖 Using AI model for prediction...")
            prediction = model.predict_proba(arr)[0][1]
            used_model = True
        else:
            logger.warning("📊 Model not available, using mock prediction...")
            prediction = float(np.clip(np.sum(arr) / 1000, 0.05, 0.95))
            used_model = False

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
            "timestamp": datetime.utcnow().isoformat(),
            "_debug": {
                "server_pid": SERVER_PID,
                "server_instance": SERVER_INSTANCE,
                "model_used": used_model,
                "model_loaded": MODEL_STATUS["loaded"],
                "model_source": MODEL_STATUS["source"],
                "model_class": MODEL_STATUS["class_name"],
                "model_expected_features": MODEL_STATUS["expected_features"],
                "model_file": model_path if used_model else "None",
                "prediction_value": round(float(prediction), 4)
            }
        }

        logger.info("✅ Prediction: %s (%s%%)", risk_level, risk_pct)

        # Save to DynamoDB (if configured)
        table = get_predictions_table()
        if table:
            try:
                save_item = {
                    "user_id": user_id,
                    "prediction_id": str(uuid.uuid4()),
                    "risk_level": risk_level,
                    "risk_percentage": str(risk_pct),
                    "features": str(features),
                    "timestamp": result["timestamp"],
                    "model_used": str(used_model)
                }
                table.put_item(Item=save_item)
                logger.info("💾 Saved to DynamoDB: %s", save_item['prediction_id'])
                result["_debug"]["saved_to_dynamodb"] = True
            except Exception as e:
                logger.exception("❌ DynamoDB save failed: %s", e)
                result["_debug"]["saved_to_dynamodb"] = False
                result["_debug"]["dynamodb_error"] = str(e)
        else:
            logger.warning("⚠️  DynamoDB table not configured")
            result["_debug"]["saved_to_dynamodb"] = False

        logger.info("✅ Response sent")
        return jsonify(result)

    except Exception as e:
        logger.exception("❌ Prediction error: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/history", methods=["GET"])
def get_history():
    """Fetch prediction history for the authenticated user from DynamoDB."""
    try:
        logger.info("📜 HISTORY REQUEST")
        
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning("❌ No auth header")
            return jsonify({"error": "No token"}), 401

        token = auth_header.replace("Bearer ", "")
        user = verify_token(token)
        if not user:
            logger.warning("❌ Invalid token")
            return jsonify({"error": "Invalid token"}), 401

        user_id = user.get("sub")
        if not user_id:
            logger.warning("❌ No 'sub' claim in token. Token claims: %s", user)
            return jsonify({"error": "Invalid token: missing 'sub' claim"}), 401
            
        logger.info("   User ID: %s", user_id)

        table = get_predictions_table()
        if not table:
            logger.warning("⚠️  DynamoDB predictions table not configured")
            return jsonify({
                "history": [], 
                "message": "DynamoDB predictions table not configured",
                "_debug": {
                    "server_pid": SERVER_PID,
                    "server_instance": SERVER_INSTANCE,
                    "table_status": "not_found",
                    "table_name": DYNAMODB_TABLE_PREDICTIONS,
                    "user_id": user_id
                }
            }), 200

        logger.info("🔍 Querying DynamoDB for user: %s", user_id)
        try:
            response = table.query(
                KeyConditionExpression=Key('user_id').eq(user_id)
            )
            items = response.get("Items", [])
            logger.info("✅ Found %s predictions", len(items))
            
            for item in items:
                logger.info("      - %s: %s (%s%%)", item.get('timestamp'), item.get('risk_level'), item.get('risk_percentage'))
        except Exception as ddb_err:
            error_name = type(ddb_err).__name__
            error_code = None
            if isinstance(ddb_err, ClientError):
                error_code = ddb_err.response.get("Error", {}).get("Code")
            logger.exception("❌ DynamoDB query error: %s: %s", error_name, str(ddb_err))
            if error_name == "ResourceNotFoundException" or error_code == "ResourceNotFoundException":
                return jsonify({
                    "history": [],
                    "message": f"DynamoDB table '{DYNAMODB_TABLE_PREDICTIONS}' was not found",
                    "_debug": {
                        "server_pid": SERVER_PID,
                        "server_instance": SERVER_INSTANCE,
                        "error_type": error_name,
                        "error_code": error_code,
                        "error_details": str(ddb_err),
                        "table_name": DYNAMODB_TABLE_PREDICTIONS,
                        "user_id": user_id
                    }
                }), 200
            raise ddb_err
        
        logger.info("✅ Response sent")
        
        return jsonify({
            "history": items,
            "_debug": {
                "server_pid": SERVER_PID,
                "server_instance": SERVER_INSTANCE,
                "total_count": len(items),
                "user_id": user_id,
                "table_name": DYNAMODB_TABLE_PREDICTIONS
            }
        })
        
    except Exception as e:
        logger.exception("❌ History error: %s: %s", type(e).__name__, str(e))
        return jsonify({
            "error": f"{type(e).__name__}: {str(e)}",
            "_debug": {
                "server_pid": SERVER_PID,
                "server_instance": SERVER_INSTANCE,
                "error_type": type(e).__name__,
                "error_details": str(e)
            }
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Starting CardioAI backend on port {port}")
    print(f"🧠 Backend server PID: {SERVER_PID}")
    print(f"📍 Cognito User Pool: {USER_POOL_ID}")
    print(f"📍 AWS Region: {AWS_REGION}")
    app.run(host="0.0.0.0", port=port)
