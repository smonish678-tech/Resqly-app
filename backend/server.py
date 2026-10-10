"""
Resqly V1 Backend - FastAPI + MongoDB
Provider Acquisition Platform & Consumer Pre-Launch Platform
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import random
import jwt
import bcrypt
import base64 as b64
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from rate_limit import (
    enforce_otp_request,
    check_admin_locked,
    record_admin_failure,
    reset_admin_failures,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------- Config ----------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALG = "HS256"
JWT_EXPIRE_DAYS = 30
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
PUBLIC_BUCKETS = set(os.environ.get("PUBLIC_BUCKETS", "profile-images").split(","))
OTP_EXPIRY_MIN = 10

# Initialise Supabase client (graceful fallback to base64 in Mongo)
supabase_client = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        from supabase import create_client  # type: ignore

        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:  # noqa
        logging.warning(f"Supabase client init failed: {e}")
        supabase_client = None

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Resqly V1 API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ---------------- Utils ----------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def make_token(payload: Dict[str, Any]) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def clean_doc(d: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if d is None:
        return None
    d.pop("_id", None)
    d.pop("password_hash", None)
    return d


async def current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    role = payload.get("role")
    sub = payload.get("sub")
    if role == "admin":
        return {"id": "admin", "role": "admin"}
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    if role == "consumer":
        doc = await db.users.find_one({"id": sub}, {"_id": 0})
    elif role == "provider":
        doc = await db.providers.find_one({"id": sub}, {"_id": 0, "password_hash": 0})
    else:
        raise HTTPException(status_code=401, detail="Unknown role")
    if not doc:
        raise HTTPException(status_code=401, detail="User not found")
    doc["role"] = role
    return doc


def require_role(*roles: str):
    async def _checker(user: Dict[str, Any] = Depends(current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return _checker


# ---------------- Models ----------------
class OTPRequest(BaseModel):
    phone: str
    role: str  # "consumer" or "provider"


class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: str


class EmailRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None


class EmailLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str


class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: Optional[str] = None


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = None
    medical_conditions: Optional[List[str]] = None
    preferred_hospital: Optional[str] = None
    emergency_contacts: Optional[List[EmergencyContact]] = None
    # Extended personal
    gender: Optional[str] = None
    dob: Optional[str] = None
    marital_status: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    profile_photo: Optional[str] = None
    # Extended medical
    current_medications: Optional[List[str]] = None
    past_medications: Optional[List[str]] = None
    chronic_diseases: Optional[List[str]] = None
    injuries: Optional[List[str]] = None
    surgeries: Optional[List[str]] = None
    # Lifestyle
    smoking_habits: Optional[str] = None
    alcohol_consumption: Optional[str] = None
    activity_level: Optional[str] = None
    food_preference: Optional[str] = None
    occupation: Optional[str] = None


class FamilyMemberCreate(BaseModel):
    name: str
    relation: str  # spouse | son | daughter | father | mother | dependent | other
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    medical_notes: Optional[str] = None


class PrescriptionCreate(BaseModel):
    doctor_name: str
    title: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None
    image_url: Optional[str] = None  # base64 data URL


class LabTestCreate(BaseModel):
    test_name: str
    status: str  # upcoming | past
    scheduled_date: Optional[str] = None
    lab_name: Optional[str] = None
    notes: Optional[str] = None


class LabReportCreate(BaseModel):
    title: str
    test_name: Optional[str] = None
    lab_name: Optional[str] = None
    date: Optional[str] = None
    file_url: Optional[str] = None  # base64 data URL


class EmergencyRequestCreate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    type: str = "ambulance"


class WaitlistCreate(BaseModel):
    name: str
    phone: str
    city: str
    location: Optional[str] = None
    service_interest: Optional[str] = None


class MarketplaceRequestCreate(BaseModel):
    service_type: str
    description: Optional[str] = None
    requested_items: List[str] = []
    attachment_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class PharmacyQuotationCreate(BaseModel):
    request_id: str
    items: List[Dict[str, Any]] = []
    coverage_confirmed: bool = False
    notes: Optional[str] = None

class LabQuotationCreate(BaseModel):
    request_id: str
    total_price: float
    available_slots: Optional[str] = None
    notes: Optional[str] = None

class AcceptQuotationRequest(BaseModel):
    quotation_id: str

class MarketplaceCancelRequest(BaseModel):
    reason: Optional[str] = None

class DoctorConsultationPaymentOrder(BaseModel):
    consultation_type: str
    problem: str
    languages: List[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class DoctorConsultationPaymentVerify(BaseModel):
    consultation_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class DoctorPrescriptionCreate(BaseModel):
    consultation_id: str
    title: Optional[str] = None
    notes: Optional[str] = None
    medications: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up: Optional[str] = None


class ProviderCategoryUpdate(BaseModel):
    category: str


class ProviderProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    service_area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_photo: Optional[str] = None
    description: Optional[str] = None
    languages: Optional[List[str]] = None
    specialization: Optional[List[str]] = None
    bank_account_holder: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None


class ProviderAvailability(BaseModel):
    availability_status: str  # available | busy | offline
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DocumentUpload(BaseModel):
    document_type: str
    document_url: str  # base64 data URL or external URL
    file_name: Optional[str] = None


class AdminLogin(BaseModel):
    password: str


class AdminDecision(BaseModel):
    status: str  # approved | rejected | resubmit
    reason: Optional[str] = None


# ---------------- Category KYC Requirements ----------------
KYC_REQUIREMENTS = {
    "ambulance": [
        "Aadhaar",
        "Driving License",
        "Vehicle RC",
        "Insurance",
        "Ambulance Registration",
        "Selfie Verification",
    ],
    "doctor": [
        "Aadhaar",
        "Medical License",
        "Degree Certificate",
        "Clinic Address",
        "Selfie Verification",
    ],
    "pharmacy": ["Drug License", "GST Certificate", "Shop License", "Aadhaar"],
    "home_nursing": ["Aadhaar", "Nursing License", "Experience Certificate"],
    "home_care": ["Aadhaar", "ID Proof", "Experience Certificate", "Selfie Verification"],
    "bystander": ["Aadhaar", "ID Proof", "Selfie Verification"],
    "pet_doctor": ["Veterinary License", "Degree Certificate", "Aadhaar"],
    "pet_pharmacy": ["Drug License", "GST Certificate", "Shop License", "Aadhaar"],
    "lab_test": ["Lab Registration / License", "GST Certificate", "Business Address Proof", "Aadhaar"],
}

SPECIALIZATIONS = {
    "doctor": [
        "General Physician",
        "Pediatrician",
        "Orthopedic",
        "Cardiologist",
        "Dermatologist",
    ],
    "ambulance": [
        "Basic Ambulance",
        "ICU Ambulance",
        "Cardiac Ambulance",
        "Neonatal Ambulance",
    ],
    "home_nursing": ["Elder Care", "Post Surgery Care", "ICU Support", "Home Visit"],
    "pet_doctor": ["General Vet", "Emergency Vet", "Pet Pharmacy"],
    "pharmacy": [],
    "home_care": [],
    "bystander": [],
    "pet_pharmacy": [],
    "lab_test": [],
}


def calc_user_profile_completion(user: Dict[str, Any]) -> int:
    """Calculate consumer profile completion percentage across all sections."""
    fields = [
        # Personal
        "name", "email", "phone", "gender", "dob", "blood_group",
        "marital_status", "height_cm", "weight_kg", "city", "location",
        "profile_photo", "preferred_hospital",
        # Medical
        "allergies", "current_medications", "past_medications",
        "chronic_diseases", "medical_conditions", "surgeries",
        # Lifestyle
        "smoking_habits", "alcohol_consumption", "activity_level",
        "food_preference", "occupation",
        # Emergency
        "emergency_contacts",
    ]
    filled = 0
    for f in fields:
        v = user.get(f)
        if isinstance(v, list):
            if len(v) > 0:
                filled += 1
        elif v not in (None, "", 0):
            filled += 1
    return int(round((filled / len(fields)) * 100))


def calc_profile_completion(provider: Dict[str, Any]) -> int:
    """Calculate profile completion percentage."""
    fields = [
        "name",
        "email",
        "city",
        "service_area",
        "profile_photo",
        "description",
        "languages",
        "specialization",
        "bank_account_number",
    ]
    filled = 0
    for f in fields:
        v = provider.get(f)
        if isinstance(v, list):
            if len(v) > 0:
                filled += 1
        elif v:
            filled += 1
    return int((filled / len(fields)) * 100)


# ---------------- Health ----------------
@api.get("/")
async def root():
    return {"message": "Resqly V1 API", "status": "ok"}


@api.get("/health")
async def health():
    return {"status": "healthy", "timestamp": now_iso()}


# ---------------- Auth (Mock OTP - random per attempt) ----------------
def _gen_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


@api.post("/auth/otp/request")
async def request_otp(payload: OTPRequest, request: Request):
    """Request OTP. Returns the mock OTP (random) for V1 (no SMS gateway)."""
    if payload.role not in ("consumer", "provider"):
        raise HTTPException(status_code=400, detail="Invalid role")
    # Rate-limit: 1/60s per phone, 5/hour per IP
    enforce_otp_request(request, payload.phone)
    otp = _gen_otp()
    await db.otp_requests.insert_one(
        {
            "id": new_id(),
            "phone": payload.phone,
            "role": payload.role,
            "otp": otp,
            "created_at": now_iso(),
            "expires_at": (
                datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MIN)
            ).isoformat(),
            "used": False,
        }
    )
    return {
        "success": True,
        "message": f"OTP sent to {payload.phone}",
        "mock_otp": otp,  # exposed for V1 pre-launch (no real SMS)
        "expires_in_seconds": OTP_EXPIRY_MIN * 60,
    }


@api.post("/auth/otp/resend")
async def resend_otp(payload: OTPRequest, request: Request):
    return await request_otp(payload, request)


@api.post("/auth/otp/verify")
async def verify_otp(payload: OTPVerify):
    # Find the latest unused OTP for this phone/role
    record = await db.otp_requests.find_one(
        {"phone": payload.phone, "role": payload.role, "used": False},
        sort=[("created_at", -1)],
    )
    if not record:
        raise HTTPException(status_code=400, detail="No OTP requested. Please request a new one.")
    # Check expiry
    try:
        expires_at = datetime.fromisoformat(record["expires_at"])
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    except (KeyError, ValueError):
        pass
    if record.get("otp") != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    # Mark used
    await db.otp_requests.update_one({"_id": record["_id"]}, {"$set": {"used": True}})
    if payload.role == "consumer":
        user = await db.users.find_one({"phone": payload.phone}, {"_id": 0})
        is_new = False
        if not user:
            is_new = True
            user = {
                "id": new_id(),
                "name": "",
                "phone": payload.phone,
                "email": "",
                "role": "consumer",
                "city": "",
                "location": "",
                "latitude": None,
                "longitude": None,
                "emergency_contacts": [],
                "blood_group": "",
                "allergies": [],
                "medical_conditions": [],
                "preferred_hospital": "",
                # Extended personal
                "gender": "",
                "dob": "",
                "marital_status": "",
                "height_cm": None,
                "weight_kg": None,
                "profile_photo": "",
                # Extended medical
                "current_medications": [],
                "past_medications": [],
                "chronic_diseases": [],
                "injuries": [],
                "surgeries": [],
                # Lifestyle
                "smoking_habits": "",
                "alcohol_consumption": "",
                "activity_level": "",
                "food_preference": "",
                "occupation": "",
                "created_at": now_iso(),
            }
            await db.users.insert_one(user.copy())
            user.pop("_id", None)
        token = make_token({"sub": user["id"], "role": "consumer"})
        return {"token": token, "user": clean_doc(user), "is_new": is_new}
    elif payload.role == "provider":
        provider = await db.providers.find_one(
            {"phone": payload.phone}, {"_id": 0, "password_hash": 0}
        )
        is_new = False
        if not provider:
            is_new = True
            provider = {
                "id": new_id(),
                "category": "",
                "name": "",
                "phone": payload.phone,
                "email": "",
                "city": "",
                "service_area": "",
                "latitude": None,
                "longitude": None,
                "approval_status": "incomplete",  # incomplete | pending | approved | rejected | resubmit
                "availability_status": "offline",
                "profile_photo": "",
                "description": "",
                "languages": [],
                "specialization": [],
                "rating": 0.0,
                "profile_completion": 0,
                "created_at": now_iso(),
            }
            await db.providers.insert_one(provider.copy())
            provider.pop("_id", None)
            provider.pop("password_hash", None)
        token = make_token({"sub": provider["id"], "role": "provider"})
        return {"token": token, "provider": provider, "is_new": is_new}
    else:
        raise HTTPException(status_code=400, detail="Invalid role")


# ---------------- Auth (Email for providers) ----------------
@api.post("/auth/provider/register")
async def provider_register(payload: EmailRegister):
    existing = await db.providers.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    provider = {
        "id": new_id(),
        "category": "",
        "name": payload.name or "",
        "phone": payload.phone or "",
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "city": "",
        "service_area": "",
        "latitude": None,
        "longitude": None,
        "approval_status": "incomplete",
        "availability_status": "offline",
        "profile_photo": "",
        "description": "",
        "languages": [],
        "specialization": [],
        "rating": 0.0,
        "profile_completion": 0,
        "created_at": now_iso(),
    }
    await db.providers.insert_one(provider.copy())
    token = make_token({"sub": provider["id"], "role": "provider"})
    provider.pop("password_hash", None)
    provider.pop("_id", None)
    return {"token": token, "provider": provider, "is_new": True}


@api.post("/auth/provider/login")
async def provider_login(payload: EmailLogin):
    provider = await db.providers.find_one({"email": payload.email.lower()})
    if not provider or not provider.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, provider["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token({"sub": provider["id"], "role": "provider"})
    provider.pop("password_hash", None)
    provider.pop("_id", None)
    return {"token": token, "provider": provider, "is_new": False}


@api.post("/auth/provider/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    provider = await db.providers.find_one({"email": payload.email.lower()})
    if not provider:
        # Don't reveal if email exists
        return {"success": True, "message": "If the email exists, a reset token has been sent."}
    reset_token = new_id()
    await db.providers.update_one(
        {"id": provider["id"]},
        {"$set": {"reset_token": reset_token, "reset_token_at": now_iso()}},
    )
    # V1: return reset token directly (no email service)
    return {
        "success": True,
        "message": "Reset token generated",
        "reset_token": reset_token,  # exposed for V1
    }


@api.post("/auth/provider/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    provider = await db.providers.find_one({"email": payload.email.lower()})
    if not provider or provider.get("reset_token") != payload.reset_token:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    await db.providers.update_one(
        {"id": provider["id"]},
        {
            "$set": {"password_hash": hash_password(payload.new_password)},
            "$unset": {"reset_token": "", "reset_token_at": ""},
        },
    )
    return {"success": True, "message": "Password updated"}


# ---------------- Consumer (User Profile) ----------------
@api.get("/me")
async def get_me(user: Dict[str, Any] = Depends(current_user)):
    if user.get("role") == "consumer":
        user["profile_completion"] = calc_user_profile_completion(user)
    return {"user": user}


@api.patch("/users/me")
async def update_my_profile(
    payload: UserProfileUpdate,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if "emergency_contacts" in updates:
        updates["emergency_contacts"] = [
            c if isinstance(c, dict) else c.model_dump() for c in updates["emergency_contacts"]
        ]
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    doc["profile_completion"] = calc_user_profile_completion(doc)
    return {"user": doc}


# ---------------- Family Members ----------------
@api.get("/users/me/family")
async def list_family(user: Dict[str, Any] = Depends(require_role("consumer"))):
    cursor = db.family_members.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    members = await cursor.to_list(100)
    return {"members": members}


@api.post("/users/me/family")
async def add_family(
    payload: FamilyMemberCreate,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    m = payload.model_dump()
    m["id"] = new_id()
    m["user_id"] = user["id"]
    m["created_at"] = now_iso()
    await db.family_members.insert_one(m.copy())
    m.pop("_id", None)
    return {"member": m}


@api.patch("/users/me/family/{member_id}")
async def update_family(
    member_id: str,
    payload: FamilyMemberCreate,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    updates = payload.model_dump(exclude_none=True)
    res = await db.family_members.update_one(
        {"id": member_id, "user_id": user["id"]}, {"$set": updates}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    doc = await db.family_members.find_one({"id": member_id}, {"_id": 0})
    return {"member": doc}


@api.delete("/users/me/family/{member_id}")
async def delete_family(
    member_id: str, user: Dict[str, Any] = Depends(require_role("consumer"))
):
    res = await db.family_members.delete_one({"id": member_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"success": True}


# ---------------- Prescriptions ----------------
@api.get("/users/me/prescriptions")
async def list_prescriptions(user: Dict[str, Any] = Depends(require_role("consumer"))):
    cursor = db.prescriptions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(100)
    return {"prescriptions": items}


@api.post("/users/me/prescriptions")
async def add_prescription(
    payload: PrescriptionCreate,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    p = payload.model_dump()
    p["id"] = new_id()
    p["user_id"] = user["id"]
    p["created_at"] = now_iso()
    if not p.get("date"):
        p["date"] = now_iso()[:10]
    await db.prescriptions.insert_one(p.copy())
    p.pop("_id", None)
    return {"prescription": p}


@api.delete("/users/me/prescriptions/{p_id}")
async def delete_prescription(
    p_id: str, user: Dict[str, Any] = Depends(require_role("consumer"))
):
    res = await db.prescriptions.delete_one({"id": p_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ---------------- Lab Tests ----------------
@api.get("/users/me/lab-tests")
async def list_lab_tests(user: Dict[str, Any] = Depends(require_role("consumer"))):
    cursor = db.lab_tests.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(200)
    return {"tests": items}


@api.post("/users/me/lab-tests")
async def add_lab_test(
    payload: LabTestCreate,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    t = payload.model_dump()
    t["id"] = new_id()
    t["user_id"] = user["id"]
    t["created_at"] = now_iso()
    await db.lab_tests.insert_one(t.copy())
    t.pop("_id", None)
    return {"test": t}


@api.patch("/users/me/lab-tests/{t_id}")
async def update_lab_test(
    t_id: str,
    payload: LabTestCreate,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    updates = payload.model_dump(exclude_none=True)
    res = await db.lab_tests.update_one(
        {"id": t_id, "user_id": user["id"]}, {"$set": updates}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await db.lab_tests.find_one({"id": t_id}, {"_id": 0})
    return {"test": doc}


@api.delete("/users/me/lab-tests/{t_id}")
async def delete_lab_test(
    t_id: str, user: Dict[str, Any] = Depends(require_role("consumer"))
):
    res = await db.lab_tests.delete_one({"id": t_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


@api.get("/users/me/lab-reports")
async def list_lab_reports(user: Dict[str, Any] = Depends(require_role("consumer"))):
    cursor = db.lab_reports.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(100)
    return {"reports": items}


@api.post("/users/me/lab-reports")
async def add_lab_report(
    payload: LabReportCreate,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    r = payload.model_dump()
    r["id"] = new_id()
    r["user_id"] = user["id"]
    r["created_at"] = now_iso()
    if not r.get("date"):
        r["date"] = now_iso()[:10]
    await db.lab_reports.insert_one(r.copy())
    r.pop("_id", None)
    return {"report": r}


@api.delete("/users/me/lab-reports/{r_id}")
async def delete_lab_report(
    r_id: str, user: Dict[str, Any] = Depends(require_role("consumer"))
):
    res = await db.lab_reports.delete_one({"id": r_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ---------------- Marketplace matching helpers ----------------
def _norm_item(value: str) -> str:
    return " ".join((value or "").strip().lower().split())

def _coverage_count(requested: List[str], quoted: List[Dict[str, Any]]) -> int:
    req = {_norm_item(v) for v in requested if _norm_item(v)}
    got = {_norm_item(str(r.get("name") or r.get("medicine") or "")) for r in (quoted or []) if isinstance(r, dict) and int(r.get("quantity") or 1) > 0}
    return len(req & got)

def _all_items_covered(requested: List[str], quoted: List[Dict[str, Any]]) -> bool:
    req = {_norm_item(v) for v in requested if _norm_item(v)}
    return bool(req) and _coverage_count(requested, quoted) == len(req)

def _distance_km(lat1, lon1, lat2, lon2) -> Optional[float]:
    if None in (lat1, lon1, lat2, lon2):
        return None
    from math import radians, sin, cos, asin, sqrt
    r = 6371.0
    dlat = radians(lat2 - lat1); dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return round(2 * r * asin(sqrt(a)), 2)

def _eta_minutes(distance_km: Optional[float], service_type: str) -> Optional[int]:
    if distance_km is None:
        return None
    speed = 24 if service_type == "pharmacy" else 28
    return max(5, int(round((distance_km / speed) * 60)))

def _quote_rank(quote: Dict[str, Any]):
    return (float(quote.get("total_price", 10**12)), int(quote.get("eta_minutes") or 10**9))

def _provider_matches_request(provider: Dict[str, Any], request: Dict[str, Any]) -> bool:
    return provider.get("approval_status") == "approved" and provider.get("availability_status") == "available" and provider.get("category") == request.get("service_type") and provider.get("latitude") is not None and provider.get("longitude") is not None


# ---------------- Emergency Requests (design only - no real dispatch) ----------------
@api.post("/emergency/request")
async def emergency_request(
    payload: EmergencyRequestCreate,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    """
    Logs an emergency request. In V1 we DO NOT dispatch real ambulances.
    Architecture is in place: when provider availability tracking and
    routing are fully implemented, this endpoint will:
      1) find nearby approved providers with availability_status='available'
      2) create dispatch notifications
      3) update request status as provider accepts
    """
    # Find candidate providers (approved + available) for design completeness
    candidate_count = await db.providers.count_documents(
        {
            "approval_status": "approved",
            "availability_status": "available",
            "category": "ambulance",
        }
    )
    req = {
        "id": new_id(),
        "user_id": user["id"],
        "type": payload.type,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "address": payload.address or "",
        "notes": payload.notes or "",
        "status": "logged",  # logged | searching | dispatched | completed | cancelled
        "candidate_provider_count": candidate_count,
        "created_at": now_iso(),
    }
    await db.emergency_requests.insert_one(req.copy())
    req.pop("_id", None)
    # Create a notification for the user (record-keeping)
    await db.notifications.insert_one(
        {
            "id": new_id(),
            "user_id": user["id"],
            "title": "Emergency request logged",
            "description": f"We logged your emergency request. {candidate_count} verified ambulance provider(s) in our network. Live dispatch is not active in this pre-launch version.",
            "created_at": now_iso(),
        }
    )
    return {"success": True, "request": req}


@api.get("/emergency/requests")
async def list_emergency_requests(
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    cursor = db.emergency_requests.find({"user_id": user["id"]}, {"_id": 0}).sort(
        "created_at", -1
    )
    items = await cursor.to_list(50)
    return {"requests": items}


# ---------------- Waitlist ----------------
@api.post("/waitlist")
async def join_waitlist(payload: WaitlistCreate):
    # Prevent duplicate by phone + service_interest
    existing = await db.waitlist.find_one(
        {"phone": payload.phone, "service_interest": payload.service_interest or "general"}
    )
    if existing:
        return {
            "success": True,
            "message": "You are already on the waitlist",
            "already_exists": True,
        }
    entry = {
        "id": new_id(),
        "name": payload.name,
        "phone": payload.phone,
        "city": payload.city,
        "location": payload.location or "",
        "service_interest": payload.service_interest or "general",
        "created_at": now_iso(),
    }
    await db.waitlist.insert_one(entry.copy())
    entry.pop("_id", None)
    return {"success": True, "message": "Added to waitlist", "entry": entry}


@api.get("/waitlist/stats")
async def waitlist_stats():
    total = await db.waitlist.count_documents({})
    by_city_cursor = db.waitlist.aggregate(
        [{"$group": {"_id": "$city", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    )
    by_city = [{"city": d["_id"], "count": d["count"]} async for d in by_city_cursor]
    return {"total": total, "by_city": by_city}


# ---------------- Providers ----------------
@api.get("/providers/me")
async def get_my_provider(user: Dict[str, Any] = Depends(require_role("provider"))):
    doc = await db.providers.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    if doc:
        doc["profile_completion"] = calc_profile_completion(doc)
        doc["kyc_required"] = KYC_REQUIREMENTS.get(doc.get("category", ""), [])
        doc["specialization_options"] = SPECIALIZATIONS.get(doc.get("category", ""), [])
    return {"provider": doc}


@api.patch("/providers/me/category")
async def set_provider_category(
    payload: ProviderCategoryUpdate,
    user: Dict[str, Any] = Depends(require_role("provider")),
):
    if payload.category not in KYC_REQUIREMENTS:
        raise HTTPException(status_code=400, detail="Invalid category")
    await db.providers.update_one(
        {"id": user["id"]}, {"$set": {"category": payload.category}}
    )
    doc = await db.providers.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    doc["kyc_required"] = KYC_REQUIREMENTS[payload.category]
    doc["specialization_options"] = SPECIALIZATIONS.get(payload.category, [])
    return {"provider": doc}


@api.patch("/providers/me")
async def update_provider(
    payload: ProviderProfileUpdate,
    user: Dict[str, Any] = Depends(require_role("provider")),
):
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates:
        await db.providers.update_one({"id": user["id"]}, {"$set": updates})
    doc = await db.providers.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    doc["profile_completion"] = calc_profile_completion(doc)
    await db.providers.update_one(
        {"id": user["id"]}, {"$set": {"profile_completion": doc["profile_completion"]}}
    )
    return {"provider": doc}


@api.patch("/providers/me/availability")
async def set_availability(
    payload: ProviderAvailability,
    user: Dict[str, Any] = Depends(require_role("provider")),
):
    if payload.availability_status not in ("available", "busy", "offline"):
        raise HTTPException(status_code=400, detail="Invalid status")
    doc = await db.providers.find_one({"id": user["id"]}, {"_id": 0})
    if payload.availability_status in ("available", "busy") and doc.get("approval_status") != "approved":
        raise HTTPException(status_code=400, detail="You must be approved before going available")
    if doc.get("active_consultation_id") and payload.availability_status != "busy":
        raise HTTPException(status_code=409, detail="Finish your active doctor consultation before changing availability")
    updates = {"availability_status": payload.availability_status}
    if payload.availability_status == "available":
        lat = payload.latitude if payload.latitude is not None else doc.get("latitude")
        lng = payload.longitude if payload.longitude is not None else doc.get("longitude")
        if lat is None or lng is None:
            raise HTTPException(status_code=400, detail="Location is required to go available")
        updates.update({"latitude": lat, "longitude": lng, "last_location_at": now_iso()})
    elif payload.latitude is not None and payload.longitude is not None:
        updates.update({"latitude": payload.latitude, "longitude": payload.longitude, "last_location_at": now_iso()})
    await db.providers.update_one({"id": user["id"]}, {"$set": updates})
    return {"success": True, "availability_status": payload.availability_status, "latitude": updates.get("latitude"), "longitude": updates.get("longitude")}
# ---------------- KYC Documents ----------------
@api.post("/providers/me/documents")
async def upload_document(
    payload: DocumentUpload,
    user: Dict[str, Any] = Depends(require_role("provider")),
):
    existing = await db.provider_documents.find_one(
        {"provider_id": user["id"], "document_type": payload.document_type}
    )
    if existing:
        await db.provider_documents.update_one(
            {"id": existing["id"]},
            {
                "$set": {
                    "document_url": payload.document_url,
                    "file_name": payload.file_name or "",
                    "verification_status": "pending",
                    "updated_at": now_iso(),
                }
            },
        )
        doc = await db.provider_documents.find_one({"id": existing["id"]}, {"_id": 0})
    else:
        doc = {
            "id": new_id(),
            "provider_id": user["id"],
            "document_type": payload.document_type,
            "document_url": payload.document_url,
            "file_name": payload.file_name or "",
            "verification_status": "pending",
            "created_at": now_iso(),
        }
        await db.provider_documents.insert_one(doc.copy())
        doc.pop("_id", None)
    return {"success": True, "document": doc}


@api.get("/providers/me/documents")
async def list_my_documents(user: Dict[str, Any] = Depends(require_role("provider"))):
    cursor = db.provider_documents.find({"provider_id": user["id"]}, {"_id": 0})
    docs = await cursor.to_list(100)
    return {"documents": docs}


@api.delete("/providers/me/documents/{doc_id}")
async def delete_document(
    doc_id: str, user: Dict[str, Any] = Depends(require_role("provider"))
):
    res = await db.provider_documents.delete_one(
        {"id": doc_id, "provider_id": user["id"]}
    )
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}


@api.post("/providers/me/submit")
async def submit_for_approval(user: Dict[str, Any] = Depends(require_role("provider"))):
    """Provider submits all KYC docs for review."""
    doc = await db.providers.find_one({"id": user["id"]}, {"_id": 0})
    category = doc.get("category", "")
    if not category:
        raise HTTPException(status_code=400, detail="Select a category first")
    # Enforce doctor language requirements on the server; UI validation alone is bypassable.
    if category == "doctor":
        languages = doc.get("languages") or []
        if not isinstance(languages, list) or not any(
            isinstance(language, str) and language.strip() for language in languages
        ):
            raise HTTPException(
                status_code=400,
                detail="Select at least one language you can consult in",
            )
    required = set(KYC_REQUIREMENTS.get(category, []))
    cursor = db.provider_documents.find({"provider_id": user["id"]}, {"_id": 0})
    uploaded_docs = await cursor.to_list(100)
    uploaded_types = {d["document_type"] for d in uploaded_docs}
    missing = required - uploaded_types
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing documents: {', '.join(sorted(missing))}",
        )
    if not doc.get("name") or not doc.get("city"):
        raise HTTPException(
            status_code=400, detail="Please complete your basic profile (name, city)"
        )
    await db.providers.update_one(
        {"id": user["id"]},
        {"$set": {"approval_status": "pending", "submitted_at": now_iso()}},
    )
    return {"success": True, "approval_status": "pending"}


# ---------------- Orders / Earnings / Reviews ----------------
@api.get("/providers/me/orders")
async def list_orders(user: Dict[str, Any] = Depends(require_role("provider"))):
    cursor = db.orders.find({"provider_id": user["id"]}, {"_id": 0}).sort(
        "created_at", -1
    )
    orders = await cursor.to_list(200)
    return {"orders": orders}


@api.get("/providers/me/earnings")
async def my_earnings(user: Dict[str, Any] = Depends(require_role("provider"))):
    cursor = db.orders.find(
        {"provider_id": user["id"], "status": "completed"},
        {"_id": 0, "net_earnings": 1, "created_at": 1},
    )
    orders = await cursor.to_list(1000)
    today_str = datetime.now(timezone.utc).date().isoformat()
    month_str = datetime.now(timezone.utc).strftime("%Y-%m")
    today = sum(
        o.get("net_earnings", 0) for o in orders if (o.get("created_at", "")[:10]) == today_str
    )
    monthly = sum(
        o.get("net_earnings", 0)
        for o in orders
        if (o.get("created_at", "")[:7]) == month_str
    )
    lifetime = sum(o.get("net_earnings", 0) for o in orders)
    return {
        "today": today,
        "monthly": monthly,
        "lifetime": lifetime,
        "payout_history": [],
        "completed_count": len(orders),
    }


@api.get("/providers/me/reviews")
async def my_reviews(user: Dict[str, Any] = Depends(require_role("provider"))):
    cursor = db.reviews.find({"provider_id": user["id"]}, {"_id": 0}).sort(
        "created_at", -1
    )
    reviews = await cursor.to_list(200)
    avg = 0.0
    if reviews:
        avg = round(sum(r.get("rating", 0) for r in reviews) / len(reviews), 1)
    return {"reviews": reviews, "average": avg, "total": len(reviews)}


# ---------------- Doctor consultations ----------------
def _doctor_prices():
    try:
        online = int(os.environ.get("DOCTOR_ONLINE_PRICE_INR", "0"))
        home = int(os.environ.get("DOCTOR_HOME_VISIT_PRICE_INR", "0"))
    except ValueError:
        online, home = 0, 0
    return max(0, online), max(0, home)


@api.get("/doctor-consultations/config")
async def doctor_consultation_config():
    online, home = _doctor_prices()
    configured = bool(os.environ.get("RAZORPAY_KEY_ID") and os.environ.get("RAZORPAY_KEY_SECRET") and online > 0 and home > 0)
    return {
        "available": configured,
        "online_price": online,
        "home_visit_price": home,
        "currency": "INR",
        "message": "" if configured else "Secure checkout is not configured yet. Please try again later.",
    }


@api.post("/doctor-consultations/payment-order")
async def create_doctor_payment_order(
    payload: DoctorConsultationPaymentOrder,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    if payload.consultation_type not in ("online", "home_visit"):
        raise HTTPException(status_code=400, detail="Choose online consultation or home visit")
    problem = payload.problem.strip()
    languages = list(dict.fromkeys([x.strip() for x in payload.languages if isinstance(x, str) and x.strip()]))
    if len(problem) < 8 or len(problem) > 2000:
        raise HTTPException(status_code=400, detail="Describe the problem in 8 to 2000 characters")
    if not languages:
        raise HTTPException(status_code=400, detail="Choose at least one language")
    if payload.consultation_type == "home_visit" and (payload.latitude is None or payload.longitude is None):
        raise HTTPException(status_code=400, detail="Location is required for a home visit")
    online_price, home_price = _doctor_prices()
    price = online_price if payload.consultation_type == "online" else home_price
    key_id = os.environ.get("RAZORPAY_KEY_ID", "")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret or price <= 0:
        raise HTTPException(status_code=503, detail="Secure doctor payment is not configured. No payment or broadcast has occurred.")
    candidate_query = {
        "category": "doctor", "approval_status": "approved",
        "availability_status": "available", "languages": {"$in": languages},
    }
    candidates = await db.providers.find(candidate_query, {"_id": 0, "id": 1, "latitude": 1, "longitude": 1}).to_list(1000)
    if payload.consultation_type == "home_visit":
        candidates = [
            p for p in candidates
            if _distance_km(payload.latitude, payload.longitude, p.get("latitude"), p.get("longitude")) is not None
            and _distance_km(payload.latitude, payload.longitude, p.get("latitude"), p.get("longitude")) <= 25
        ]
    if not candidates:
        raise HTTPException(status_code=409, detail="No matching doctors are available right now. Please try again later; you have not been charged.")
    try:
        import razorpay
        consultation_id = new_id()
        receipt = ("doc" + consultation_id.replace("-", ""))[:40]
        client = razorpay.Client(auth=(key_id, key_secret))
        order = client.order.create(data={
            "amount": price * 100,
            "currency": "INR",
            "receipt": receipt,
            "notes": {"consultation_id": consultation_id, "consumer_id": user["id"], "consultation_type": payload.consultation_type},
        })
    except Exception:
        logging.exception("Razorpay order creation failed for doctor consultation")
        raise HTTPException(status_code=502, detail="Secure checkout could not be started. Please try again.")
    consultation = {
        "id": consultation_id,
        "user_id": user["id"],
        "customer_name": user.get("name") or "Patient",
        "consultation_type": payload.consultation_type,
        "problem": problem,
        "languages": languages,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "address": payload.address or user.get("location") or user.get("city") or "",
        "amount": price,
        "currency": "INR",
        "payment_status": "pending",
        "razorpay_order_id": order["id"],
        "status": "payment_pending",
        "created_at": now_iso(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
    }
    await db.doctor_consultations.insert_one(consultation.copy())
    return {
        "consultation_id": consultation_id,
        "razorpay_order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "checkout_key": key_id,
    }


@api.post("/doctor-consultations/payment-verify")
async def verify_doctor_payment(
    payload: DoctorConsultationPaymentVerify,
    user: Dict[str, Any] = Depends(require_role("consumer")),
):
    consultation = await db.doctor_consultations.find_one(
        {"id": payload.consultation_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation checkout not found")
    if consultation.get("status") == "broadcasting":
        return {"consultation": consultation}
    if consultation.get("status") != "payment_pending" or consultation.get("razorpay_order_id") != payload.razorpay_order_id:
        raise HTTPException(status_code=409, detail="This checkout is no longer valid")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not key_secret:
        raise HTTPException(status_code=503, detail="Payment verification is not configured")
    try:
        import hmac
        import hashlib
        expected = hmac.new(
            key_secret.encode("utf-8"),
            (payload.razorpay_order_id + "|" + payload.razorpay_payment_id).encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, payload.razorpay_signature):
            raise HTTPException(status_code=400, detail="Payment signature could not be verified")
        import razorpay
        razorpay_client = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID", ""), key_secret))
        payment = razorpay_client.payment.fetch(payload.razorpay_payment_id)
        if payment.get("order_id") != payload.razorpay_order_id or payment.get("status") != "captured":
            raise HTTPException(status_code=409, detail="Payment is not captured yet. Please wait or contact support.")
        if int(payment.get("amount") or 0) != int(consultation["amount"]) * 100:
            raise HTTPException(status_code=400, detail="Payment amount does not match this consultation")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    online = consultation.get("consultation_type") == "online"
    candidate_query = {
        "category": "doctor",
        "approval_status": "approved",
        "availability_status": "available",
        "languages": {"$in": consultation["languages"]},
    }
    if not online:
        candidate_query.update({"latitude": {"$ne": None}, "longitude": {"$ne": None}})
    candidates = await db.providers.find(candidate_query, {"_id": 0, "id": 1, "latitude": 1, "longitude": 1}).to_list(1000)
    if not online:
        candidates = [
            p for p in candidates
            if _distance_km(consultation["latitude"], consultation["longitude"], p.get("latitude"), p.get("longitude")) is not None
            and _distance_km(consultation["latitude"], consultation["longitude"], p.get("latitude"), p.get("longitude")) <= 25
        ]
    now = now_iso()
    if not candidates:
        refund_status = "refund_pending"
        try:
            import razorpay
            razorpay_client = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID", ""), key_secret))
            razorpay_client.payment.refund(payload.razorpay_payment_id, data={"amount": int(consultation["amount"]) * 100})
            refund_status = "refunded"
        except Exception:
            logging.exception("Automatic refund failed because no eligible doctor remained")
        await db.doctor_consultations.update_one(
            {"id": consultation["id"], "user_id": user["id"], "status": "payment_pending"},
            {"$set": {
                "payment_status": refund_status,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "paid_at": now,
                "status": "refunded_no_doctor" if refund_status == "refunded" else "refund_pending",
                "refund_status": refund_status,
                "candidate_count": 0,
                "updated_at": now,
            }},
        )
        await db.notifications.insert_one({
            "id": new_id(), "user_id": user["id"],
            "title": "No doctor available",
            "message": "No matching doctor was available after payment verification. Refund status: " + refund_status.replace("_", " ") + ".",
            "type": "doctor_consultation", "related_id": consultation["id"], "read": False, "created_at": now,
        })
        fresh = await db.doctor_consultations.find_one({"id": consultation["id"], "user_id": user["id"]}, {"_id": 0})
        return {"consultation": fresh}
    update = {
        "payment_status": "paid",
        "razorpay_payment_id": payload.razorpay_payment_id,
        "paid_at": now,
        "status": "broadcasting",
        "candidate_count": len(candidates),
        "broadcasted_at": now,
        "updated_at": now,
        "join_window_seconds": 300,
    }
    result = await db.doctor_consultations.update_one(
        {"id": consultation["id"], "user_id": user["id"], "status": "payment_pending"},
        {"$set": update},
    )
    if result.modified_count != 1:
        fresh = await db.doctor_consultations.find_one({"id": consultation["id"], "user_id": user["id"]}, {"_id": 0})
        if fresh and fresh.get("status") == "broadcasting":
            return {"consultation": fresh}
        raise HTTPException(status_code=409, detail="This consultation has already changed")
    await db.notifications.insert_one({
        "id": new_id(), "user_id": user["id"], "title": "Doctor request sent",
        "message": "Your payment is verified and eligible doctors are being notified.",
        "type": "doctor_consultation", "related_id": consultation["id"], "read": False, "created_at": now,
    })
    fresh = await db.doctor_consultations.find_one({"id": consultation["id"], "user_id": user["id"]}, {"_id": 0})
    return {"consultation": fresh}


@api.get("/doctor-consultations/{consultation_id}")
async def get_doctor_consultation(consultation_id: str, user: Dict[str, Any] = Depends(current_user)):
    consultation = await db.doctor_consultations.find_one({"id": consultation_id}, {"_id": 0})
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if user.get("role") == "consumer" and consultation.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user.get("role") == "provider" and consultation.get("provider_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user.get("role") not in ("consumer", "provider"):
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"consultation": consultation}


@api.post("/doctor-consultations/{consultation_id}/cancel")
async def cancel_doctor_consultation(consultation_id: str, user: Dict[str, Any] = Depends(require_role("consumer"))):
    result = await db.doctor_consultations.update_one(
        {"id": consultation_id, "user_id": user["id"], "status": {"$in": ["payment_pending", "broadcasting"]}},
        {"$set": {"status": "cancelled", "cancelled_at": now_iso(), "updated_at": now_iso()}},
    )
    if result.modified_count != 1:
        raise HTTPException(status_code=409, detail="This consultation can no longer be cancelled")
    consultation = await db.doctor_consultations.find_one({"id": consultation_id, "user_id": user["id"]}, {"_id": 0})
    return {"consultation": consultation}


@api.get("/providers/me/doctor-consultations")
async def doctor_consultation_requests(user: Dict[str, Any] = Depends(require_role("provider"))):
    if user.get("category") != "doctor" or user.get("approval_status") != "approved" or user.get("availability_status") != "available":
        return {"requests": []}
    query = {
        "status": "broadcasting",
        "languages": {"$in": user.get("languages") or []},
        "expires_at": {"$gt": now_iso()},
    }
    cursor = db.doctor_consultations.find(query, {"_id": 0, "razorpay_order_id": 0, "razorpay_payment_id": 0, "user_id": 0}).sort("created_at", 1)
    requests = await cursor.to_list(100)
    if user.get("latitude") is None or user.get("longitude") is None:
        requests = [r for r in requests if r.get("consultation_type") == "online"]
    else:
        filtered = []
        for r in requests:
            if r.get("consultation_type") == "online":
                filtered.append(r)
            elif r.get("latitude") is not None and r.get("longitude") is not None:
                distance = _distance_km(user["latitude"], user["longitude"], r["latitude"], r["longitude"])
                if distance is not None and distance <= 25:
                    r["distance_km"] = round(distance, 1)
                    filtered.append(r)
        requests = filtered
    return {"requests": requests}


@api.post("/providers/me/doctor-consultations/{consultation_id}/accept")
async def accept_doctor_consultation(consultation_id: str, user: Dict[str, Any] = Depends(require_role("provider"))):
    if user.get("category") != "doctor" or user.get("approval_status") != "approved" or user.get("availability_status") != "available":
        raise HTTPException(status_code=403, detail="Only approved, available doctors can accept requests")
    consultation = await db.doctor_consultations.find_one({"id": consultation_id, "status": "broadcasting"}, {"_id": 0})
    if not consultation:
        raise HTTPException(status_code=409, detail="Another doctor accepted this request, or it expired")
    if not set(user.get("languages") or []).intersection(consultation.get("languages") or []):
        raise HTTPException(status_code=403, detail="Your verified languages do not match this patient")
    if consultation.get("consultation_type") == "home_visit":
        distance = _distance_km(user.get("latitude"), user.get("longitude"), consultation.get("latitude"), consultation.get("longitude"))
        if distance is None or distance > 25:
            raise HTTPException(status_code=403, detail="This home visit is outside your service radius")
    # Reserve provider first so a doctor cannot accept two simultaneous requests.
    reserve = await db.providers.update_one(
        {"id": user["id"], "approval_status": "approved", "availability_status": "available"},
        {"$set": {"availability_status": "busy", "active_consultation_id": consultation_id}},
    )
    if reserve.modified_count != 1:
        raise HTTPException(status_code=409, detail="You are no longer available for new requests")
    now = datetime.now(timezone.utc)
    deadline = (now + timedelta(minutes=5)).isoformat()
    accepted = await db.doctor_consultations.update_one(
        {"id": consultation_id, "status": "broadcasting"},
        {"$set": {"status": "accepted", "provider_id": user["id"], "doctor_name": user.get("name") or "Doctor", "accepted_at": now.isoformat(), "join_deadline": deadline, "updated_at": now.isoformat()}},
    )
    if accepted.modified_count != 1:
        await db.providers.update_one({"id": user["id"], "active_consultation_id": consultation_id}, {"$set": {"availability_status": "available"}, "$unset": {"active_consultation_id": ""}})
        raise HTTPException(status_code=409, detail="Another doctor accepted this request")
    await db.notifications.insert_one({
        "id": new_id(), "user_id": consultation["user_id"], "title": "A doctor accepted",
        "message": "Your doctor accepted. Join the consultation within 5 minutes.",
        "type": "doctor_consultation", "related_id": consultation_id, "read": False, "created_at": now.isoformat(),
    })
    fresh = await db.doctor_consultations.find_one({"id": consultation_id}, {"_id": 0})
    return {"consultation": fresh}


@api.post("/doctor-consultations/{consultation_id}/prescription")
async def write_doctor_prescription(
    consultation_id: str,
    payload: DoctorPrescriptionCreate,
    user: Dict[str, Any] = Depends(require_role("provider")),
):
    consultation = await db.doctor_consultations.find_one({
        "id": consultation_id, "provider_id": user["id"], "status": {"$in": ["accepted", "in_call", "completed"]}
    }, {"_id": 0})
    if not consultation or user.get("category") != "doctor" or user.get("approval_status") != "approved":
        raise HTTPException(status_code=403, detail="Only the assigned verified doctor can write this prescription")
    meds = []
    for med in payload.medications:
        name = str(med.get("name") or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Every medication needs a name")
        meds.append({"name": name, "dosage": str(med.get("dosage") or "").strip(), "frequency": str(med.get("frequency") or "").strip(), "duration": str(med.get("duration") or "").strip()})
    existing = await db.prescriptions.find_one({"consultation_id": consultation_id}, {"_id": 0})
    prescription = {
        "id": existing.get("id") if existing else new_id(),
        "user_id": consultation["user_id"],
        "consultation_id": consultation_id,
        "doctor_name": user.get("name") or "Doctor",
        "title": (payload.title or "Doctor consultation").strip(),
        "notes": (payload.notes or "").strip(),
        "medications": meds,
        "follow_up": (payload.follow_up or "").strip(),
        "date": now_iso()[:10],
        "created_at": existing.get("created_at") if existing else now_iso(),
        "source": "doctor_consultation",
    }
    await db.prescriptions.update_one({"consultation_id": consultation_id}, {"$set": prescription}, upsert=True)
    return {"prescription": prescription}


@api.post("/doctor-consultations/{consultation_id}/complete")
async def complete_doctor_consultation(consultation_id: str, user: Dict[str, Any] = Depends(current_user)):
    if user.get("role") not in ("consumer", "provider"):
        raise HTTPException(status_code=403, detail="Forbidden")
    consultation_before = await db.doctor_consultations.find_one({"id": consultation_id}, {"_id": 0})
    if not consultation_before:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if user["role"] == "consumer" and consultation_before.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user["role"] == "provider" and consultation_before.get("provider_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    result = await db.doctor_consultations.update_one(
        {"id": consultation_id, "status": {"$in": ["accepted", "in_call"]}},
        {"$set": {"status": "completed", "completed_at": now_iso(), "updated_at": now_iso()}},
    )
    if result.modified_count != 1:
        raise HTTPException(status_code=409, detail="Consultation is not active")
    assigned_provider_id = consultation_before.get("provider_id")
    if assigned_provider_id:
        await db.providers.update_one(
            {"id": assigned_provider_id, "active_consultation_id": consultation_id},
            {"$set": {"availability_status": "available"}},
            {"$unset": {"active_consultation_id": ""}},
        )
    consultation = await db.doctor_consultations.find_one({"id": consultation_id}, {"_id": 0})
    return {"consultation": consultation}


# ---------------- Marketplace: Pharmacy + Lab ----------------
@api.post("/marketplace/requests")
async def create_marketplace_request(payload: MarketplaceRequestCreate, user: Dict[str, Any] = Depends(require_role("consumer"))):
    if payload.service_type not in ("pharmacy", "lab_test"):
        raise HTTPException(status_code=400, detail="Unsupported marketplace service")
    if payload.latitude is None or payload.longitude is None:
        raise HTTPException(status_code=400, detail="Location is required so Resqly can calculate ETA")
    items = list(dict.fromkeys([x.strip() for x in payload.requested_items if x and x.strip()]))
    description = (payload.description or "").strip()
    if payload.service_type == "pharmacy" and not items and not payload.attachment_url:
        raise HTTPException(status_code=400, detail="Add medicines or upload a prescription")
    if payload.service_type == "lab_test" and not items and not description and not payload.attachment_url:
        raise HTTPException(status_code=400, detail="Describe the lab test or upload a prescription")
    req = {"id": new_id(), "user_id": user["id"], "customer_name": user.get("name") or "Customer", "service_type": payload.service_type, "description": description, "requested_items": items, "attachment_url": payload.attachment_url or "", "latitude": payload.latitude, "longitude": payload.longitude, "address": payload.address or user.get("location") or user.get("city") or "", "status": "broadcasting", "created_at": now_iso(), "updated_at": now_iso(), "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}
    await db.marketplace_requests.insert_one(req.copy())
    candidate_query = {"approval_status":"approved","availability_status":"available","category":payload.service_type,"latitude":{"$ne":None},"longitude":{"$ne":None}}
    req["candidate_count"] = await db.providers.count_documents(candidate_query)
    req["broadcasted_at"] = now_iso()
    await db.marketplace_requests.update_one({"id":req["id"]},{"$set":{"candidate_count":req["candidate_count"],"broadcasted_at":req["broadcasted_at"]}})
    return {"request": req}

@api.get("/marketplace/requests/{request_id}")
async def get_marketplace_request(request_id: str, user: Dict[str, Any] = Depends(current_user)):
    req = await db.marketplace_requests.find_one({"id":request_id},{"_id":0})
    if not req: raise HTTPException(status_code=404, detail="Request not found")
    if user.get("role") == "consumer" and req.get("user_id") != user["id"]: raise HTTPException(status_code=403, detail="Forbidden")
    if user.get("role") == "provider" and not _provider_matches_request(user, req): raise HTTPException(status_code=403, detail="Provider is not eligible for this request")
    if req.get("expires_at") and req.get("status") not in ("order_placed","cancelled","expired"):
        try:
            if datetime.fromisoformat(req["expires_at"]) < datetime.now(timezone.utc):
                req["status"]="expired"
                await db.marketplace_requests.update_one({"id":req["id"]},{"$set":{"status":"expired","updated_at":now_iso()}})
        except ValueError:
            pass
    query={"request_id":request_id,"eligible":True}
    if user.get("role") == "provider": query["provider_id"]=user["id"]
    quotes=await db.marketplace_quotations.find(query,{"_id":0}).sort([("total_price",1),("eta_minutes",1)]).to_list(100)
    best=min(quotes,key=_quote_rank) if quotes else None
    return {"request":req,"quotations":quotes,"best_quotation":best}

@api.post("/marketplace/pharmacy/quotations")
async def create_pharmacy_quotation(payload: PharmacyQuotationCreate, user: Dict[str, Any] = Depends(require_role("provider"))):
    req=await db.marketplace_requests.find_one({"id":payload.request_id,"service_type":"pharmacy"},{"_id":0})
    if not req: raise HTTPException(status_code=404,detail="Pharmacy request not found")
    if not _provider_matches_request(user,req): raise HTTPException(status_code=403,detail="Provider is not eligible")
    if req.get("status") in ("cancelled","expired","order_placed"): raise HTTPException(status_code=409,detail="This request is no longer accepting quotations")
    items=[]; total=0.0
    for row in payload.items or []:
        try:
            name = _norm_item(str(row.get("name") or row.get("medicine") or ""))
            qty = int(row.get("quantity") or 1)
            unit = float(row.get("unit_price") or row.get("price") or 0)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Every medicine line needs a valid quantity and price")
        if name and qty > 0 and unit >= 0:
            line = round(qty * unit,2)
            items.append({"name":name,"quantity":qty,"unit_price":round(unit,2),"line_total":line})
            total += line
        elif not name:
            raise HTTPException(status_code=400, detail="Every medicine line needs a medicine name")
        else:
            raise HTTPException(status_code=400, detail="Medicine quantity and price must be valid")
    eligible=_all_items_covered(req.get("requested_items",[]),items) if req.get("requested_items") else bool(payload.coverage_confirmed and items)
    if not eligible: raise HTTPException(status_code=400,detail="This quotation must cover the full prescription/request to be eligible")
    distance=_distance_km(req["latitude"],req["longitude"],user["latitude"],user["longitude"])
    quote={"id":new_id(),"request_id":req["id"],"provider_id":user["id"],"provider_name":user.get("name") or "Verified pharmacy","items":items,"covered_count":_coverage_count(req.get("requested_items",[]),items) if req.get("requested_items") else None,"requested_count":len({_norm_item(x) for x in req.get("requested_items",[]) if _norm_item(x)}) or None,"coverage_confirmed":bool(payload.coverage_confirmed),"total_price":round(total,2),"distance_km":distance,"eta_minutes":_eta_minutes(distance,"pharmacy"),"notes":payload.notes or "","eligible":True,"status":"submitted","created_at":now_iso(),"expires_at":(datetime.now(timezone.utc)+timedelta(minutes=15)).isoformat()}
    await db.marketplace_quotations.update_one({"request_id":req["id"],"provider_id":user["id"]},{"$set":quote},upsert=True)
    await db.marketplace_requests.update_one({"id":req["id"]},{"$set":{"status":"quotations_received","updated_at":now_iso()}})
    return {"quotation":quote}

@api.post("/marketplace/lab/quotations")
async def create_lab_quotation(payload: LabQuotationCreate, user: Dict[str, Any] = Depends(require_role("provider"))):
    req=await db.marketplace_requests.find_one({"id":payload.request_id,"service_type":"lab_test"},{"_id":0})
    if not req: raise HTTPException(status_code=404,detail="Lab request not found")
    if not _provider_matches_request(user,req): raise HTTPException(status_code=403,detail="Provider is not eligible")
    if req.get("status") in ("cancelled","expired","order_placed"): raise HTTPException(status_code=409,detail="This request is no longer accepting quotations")
    try:
        total_price = float(payload.total_price)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Quotation price must be a valid number")
    from math import isfinite
    if not isfinite(total_price) or total_price < 0:
        raise HTTPException(status_code=400, detail="Quotation price must be a non-negative finite number")
    distance=_distance_km(req["latitude"],req["longitude"],user["latitude"],user["longitude"])
    quote={"id":new_id(),"request_id":req["id"],"provider_id":user["id"],"provider_name":user.get("name") or "Verified lab","total_price":round(total_price,2),"distance_km":distance,"eta_minutes":_eta_minutes(distance,"lab_test"),"available_slots":payload.available_slots or "","notes":payload.notes or "","eligible":True,"status":"submitted","created_at":now_iso(),"expires_at":(datetime.now(timezone.utc)+timedelta(minutes=15)).isoformat()}
    await db.marketplace_quotations.update_one({"request_id":req["id"],"provider_id":user["id"]},{"$set":quote},upsert=True)
    await db.marketplace_requests.update_one({"id":req["id"]},{"$set":{"status":"quotations_received","updated_at":now_iso()}})
    return {"quotation":quote}

@api.post("/marketplace/quotations/accept")
async def accept_marketplace_quotation(payload: AcceptQuotationRequest,user: Dict[str,Any]=Depends(require_role("consumer"))):
    quote=await db.marketplace_quotations.find_one({"id":payload.quotation_id,"eligible":True},{"_id":0})
    if not quote: raise HTTPException(status_code=404,detail="Quotation not found")
    try:
        if quote.get("expires_at") and datetime.fromisoformat(quote["expires_at"]) < datetime.now(timezone.utc):
            raise HTTPException(status_code=409,detail="This quotation has expired. Please request a fresh quote.")
    except ValueError: pass
    req=await db.marketplace_requests.find_one({"id":quote["request_id"],"user_id":user["id"]},{"_id":0})
    if not req: raise HTTPException(status_code=403,detail="Forbidden")
    if req.get("status") in ("cancelled","expired","order_placed"): raise HTTPException(status_code=409,detail="This request is no longer accepting orders")
    quotes=await db.marketplace_quotations.find({"request_id":req["id"],"eligible":True},{"_id":0}).to_list(100)
    active=[]
    for q in quotes:
        try:
            if not q.get("expires_at") or datetime.fromisoformat(q["expires_at"]) >= datetime.now(timezone.utc): active.append(q)
        except ValueError: active.append(q)
    if not active: raise HTTPException(status_code=409,detail="No active quotations")
    winner=min(active,key=_quote_rank)
    if winner["id"] != quote["id"]: raise HTTPException(status_code=409,detail="This quotation is no longer the best available offer")
    lock=await db.marketplace_requests.update_one({"id":req["id"],"status":{"$nin":["order_placed","cancelled","expired"]}},{"$set":{"status":"order_placed","accepted_quotation_id":quote["id"],"updated_at":now_iso()}})
    if lock.modified_count != 1: raise HTTPException(status_code=409,detail="This request has already been completed")
    await db.marketplace_quotations.update_many({"request_id":req["id"]},{"$set":{"status":"not_selected"}})
    await db.marketplace_quotations.update_one({"id":quote["id"]},{"$set":{"status":"accepted","accepted_at":now_iso()}})
    order={"id":new_id(),"request_id":req["id"],"provider_id":quote["provider_id"],"customer_id":user["id"],"customer_name":user.get("name") or "Customer","service_type":req["service_type"],"amount":quote["total_price"],"net_earnings":quote["total_price"],"status":"accepted","created_at":now_iso(),"quotation_id":quote["id"],"eta_minutes":quote.get("eta_minutes")}
    await db.orders.insert_one(order.copy()); order.pop("_id",None)
    return {"order":order,"quotation":quote}

@api.post("/marketplace/requests/{request_id}/cancel")
async def cancel_marketplace_request(request_id:str,payload:MarketplaceCancelRequest,user:Dict[str,Any]=Depends(require_role("consumer"))):
    result=await db.marketplace_requests.update_one({"id":request_id,"user_id":user["id"],"status":{"$in":["broadcasting","quotations_received"]}},{"$set":{"status":"cancelled","cancel_reason":payload.reason or "Cancelled by customer","updated_at":now_iso()}})
    if result.modified_count != 1: raise HTTPException(status_code=409,detail="Request can no longer be cancelled")
    return {"success":True}

@api.get("/providers/me/marketplace/requests")
async def provider_marketplace_requests(user:Dict[str,Any]=Depends(require_role("provider"))):
    if user.get("approval_status")!="approved" or user.get("availability_status")!="available" or user.get("latitude") is None or user.get("longitude") is None:
        return {"requests":[]}
    cursor=db.marketplace_requests.find({"service_type":user.get("category"),"status":{"$in":["broadcasting","quotations_received"]}},{"_id":0}).sort("created_at",-1)
    return {"requests":await cursor.to_list(100)}

@api.get("/admin/marketplace")
async def admin_marketplace(admin:Dict[str,Any]=Depends(require_role("admin"))):
    requests=await db.marketplace_requests.find({},{"_id":0}).sort("created_at",-1).to_list(100)
    quotations=await db.marketplace_quotations.find({},{"_id":0}).sort("created_at",-1).to_list(300)
    orders=await db.orders.find({"service_type":{"$in":["pharmacy","lab_test"]}},{"_id":0}).sort("created_at",-1).to_list(200)
    providers=await db.providers.find({"category":{"$in":["pharmacy","lab_test"]}},{"_id":0,"password_hash":0}).sort("name",1).to_list(200)
    return {"requests":requests,"quotations":quotations,"orders":orders,"providers":providers}


# ---------------- Notifications ----------------
@api.get("/notifications")
async def list_notifications(user: Dict[str, Any] = Depends(current_user)):
    cursor = db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort(
        "created_at", -1
    )
    notifs = await cursor.to_list(50)
    return {"notifications": notifs}


# ---------------- Delete Account / Data Deletion ----------------
class DeleteAccountRequest(BaseModel):
    reason: Optional[str] = None
    contact_email: Optional[str] = None


@api.post("/delete-account/request")
async def request_account_deletion(
    payload: DeleteAccountRequest, user: Dict[str, Any] = Depends(current_user)
):
    req = {
        "id": new_id(),
        "user_id": user["id"],
        "role": user.get("role"),
        "reason": payload.reason or "",
        "contact_email": payload.contact_email or user.get("email", ""),
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.deletion_requests.insert_one(req.copy())
    return {"success": True, "message": "Deletion request submitted. We will process within 7 days."}


# ---------------- Public Lookups ----------------
@api.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"key": "ambulance", "label": "Ambulance"},
            {"key": "doctor", "label": "Doctor"},
            {"key": "pharmacy", "label": "Pharmacy"},
            {"key": "home_nursing", "label": "Home Nursing"},
            {"key": "home_care", "label": "Home Care"},
            {"key": "bystander", "label": "Bystander"},
            {"key": "pet_doctor", "label": "Pet Doctor"},
            {"key": "pet_pharmacy", "label": "Pet Pharmacy"},
        ],
        "kyc_requirements": KYC_REQUIREMENTS,
        "specializations": SPECIALIZATIONS,
    }


@api.get("/services")
async def get_services():
    return {
        "services": [
            {"key": "doctor", "label": "Doctor", "icon": "stethoscope"},
            {"key": "pharmacy", "label": "Pharmacy", "icon": "pill"},
            {"key": "lab_test", "label": "Lab Test", "icon": "flask"},
            {"key": "ambulance", "label": "Ambulance", "icon": "ambulance"},
            {"key": "home_nursing", "label": "Home Nursing", "icon": "home"},
            {"key": "home_care", "label": "Home Care", "icon": "heart"},
            {"key": "bystander", "label": "Bystander", "icon": "users"},
            {"key": "pet_doctor", "label": "Pet Doctor", "icon": "paw"},
            {"key": "pet_pharmacy", "label": "Pet Pharmacy", "icon": "pill"},
        ]
    }


# ---------------- Storage (Supabase) ----------------
ALLOWED_BUCKETS = {"prescriptions", "lab-reports", "provider-documents", "profile-images"}


class UploadBase64Request(BaseModel):
    bucket: str
    filename: str
    content_type: Optional[str] = None
    data_base64: str


def _upload_to_supabase(bucket: str, path: str, file_bytes: bytes, content_type: str) -> Optional[str]:
    """Upload to Supabase Storage. Returns public URL or signed URL. Returns None on failure."""
    if not supabase_client:
        return None
    try:
        supabase_client.storage.from_(bucket).upload(
            path=path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "cache-control": "3600",
                "upsert": "false",
            },
        )
    except Exception as e:
        logging.error(f"Supabase upload error: {e}")
        return None
    # Get URL
    if bucket in PUBLIC_BUCKETS:
        try:
            url = supabase_client.storage.from_(bucket).get_public_url(path)
            if isinstance(url, dict):
                return url.get("publicUrl") or url.get("publicURL")
            return url
        except Exception:
            return None
    else:
        try:
            signed = supabase_client.storage.from_(bucket).create_signed_url(path, 60 * 60 * 24 * 7)
            if isinstance(signed, dict):
                return signed.get("signedURL") or signed.get("signed_url") or signed.get("signedUrl")
            return signed
        except Exception:
            return None


@api.post("/uploads/base64")
async def upload_base64(payload: UploadBase64Request, user: Dict[str, Any] = Depends(current_user)):
    if payload.bucket not in ALLOWED_BUCKETS:
        raise HTTPException(status_code=400, detail="Invalid bucket")
    data = payload.data_base64
    if "," in data and data.strip().startswith("data:"):
        data = data.split(",", 1)[1]
    try:
        file_bytes = b64.b64decode(data, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 data")
    if len(file_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 8MB)")
    return await _store_uploaded_bytes(payload.bucket, payload.filename, payload.content_type or "application/octet-stream", file_bytes, user["id"])

@api.post("/uploads/file")
async def upload_file(request: Request, bucket: str, filename: str, user: Dict[str, Any] = Depends(current_user)):
    if bucket not in ALLOWED_BUCKETS:
        raise HTTPException(status_code=400, detail="Invalid bucket")
    if not filename or len(filename) > 180:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_bytes = await request.body()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(file_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 8MB)")
    return await _store_uploaded_bytes(bucket, filename, request.headers.get("content-type") or "application/octet-stream", file_bytes, user["id"])

async def _store_uploaded_bytes(bucket: str, filename: str, content_type: str, file_bytes: bytes, user_id: str):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    safe_id = new_id()
    path = f"{user_id}/{safe_id}" + (f".{ext}" if ext else "")
    import asyncio
    public_url = None
    for attempt in range(2):
        public_url = await asyncio.to_thread(_upload_to_supabase, bucket, path, file_bytes, content_type)
        if public_url:
            break
        if attempt == 0:
            await asyncio.sleep(0.6)
    if not public_url:
        raise HTTPException(status_code=503, detail="File storage is temporarily unavailable. Please try again.")
    await db.uploads.insert_one({"id": safe_id, "user_id": user_id, "bucket": bucket, "path": path, "url": public_url, "content_type": content_type, "size_bytes": len(file_bytes), "filename": filename, "created_at": now_iso()})
    return {"success": True, "url": public_url, "bucket": bucket, "path": path}

@api.get("/uploads/me")
async def list_my_uploads(user: Dict[str, Any] = Depends(current_user)):
    cursor = db.uploads.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(200)
    return {"uploads": items}


# ---------------- Admin (Hidden) ----------------
@api.post("/admin/login")
async def admin_login(payload: AdminLogin, request: Request):
    # Lockout: 5 failed attempts / 15 min per IP
    check_admin_locked(request)
    if payload.password != ADMIN_PASSWORD:
        record_admin_failure(request)
        raise HTTPException(status_code=401, detail="Invalid admin password")
    reset_admin_failures(request)
    token = make_token({"sub": "admin", "role": "admin"})
    return {"token": token}


@api.get("/admin/providers")
async def admin_list_providers(
    status: Optional[str] = None,
    admin: Dict[str, Any] = Depends(require_role("admin")),
):
    query: Dict[str, Any] = {}
    if status:
        query["approval_status"] = status
    cursor = db.providers.find(query, {"_id": 0, "password_hash": 0}).sort(
        "created_at", -1
    )
    providers = await cursor.to_list(500)
    return {"providers": providers, "total": len(providers)}


@api.get("/admin/providers/{provider_id}")
async def admin_get_provider(
    provider_id: str, admin: Dict[str, Any] = Depends(require_role("admin"))
):
    provider = await db.providers.find_one(
        {"id": provider_id}, {"_id": 0, "password_hash": 0}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    docs_cursor = db.provider_documents.find({"provider_id": provider_id}, {"_id": 0})
    docs = await docs_cursor.to_list(100)
    return {"provider": provider, "documents": docs}


@api.post("/admin/providers/{provider_id}/decision")
async def admin_decide_provider(
    provider_id: str,
    payload: AdminDecision,
    admin: Dict[str, Any] = Depends(require_role("admin")),
):
    if payload.status not in ("approved", "rejected", "resubmit"):
        raise HTTPException(status_code=400, detail="Invalid status")
    provider = await db.providers.find_one({"id": provider_id})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    update = {
        "approval_status": payload.status,
        "rejection_reason": payload.reason or "",
        "decided_at": now_iso(),
    }
    await db.providers.update_one({"id": provider_id}, {"$set": update})
    # Add a notification for the provider
    await db.notifications.insert_one(
        {
            "id": new_id(),
            "user_id": provider_id,
            "title": f"Application {payload.status.capitalize()}",
            "description": payload.reason
            or {
                "approved": "Congratulations! Your application has been approved.",
                "rejected": "Your application has been rejected.",
                "resubmit": "Please resubmit your documents.",
            }[payload.status],
            "created_at": now_iso(),
        }
    )
    return {"success": True, "approval_status": payload.status}


@api.get("/admin/stats")
async def admin_stats(admin: Dict[str, Any] = Depends(require_role("admin"))):
    total_providers = await db.providers.count_documents({})
    approved = await db.providers.count_documents({"approval_status": "approved"})
    pending = await db.providers.count_documents({"approval_status": "pending"})
    rejected = await db.providers.count_documents({"approval_status": "rejected"})
    incomplete = await db.providers.count_documents({"approval_status": "incomplete"})
    total_users = await db.users.count_documents({})
    total_waitlist = await db.waitlist.count_documents({})
    marketplace_open = await db.marketplace_requests.count_documents({"status":{"$in":["broadcasting","quotations_received"]}})
    marketplace_orders = await db.orders.count_documents({"service_type":{"$in":["pharmacy","lab_test"]}})
    by_category_cursor = db.providers.aggregate(
        [
            {"$match": {"category": {"$ne": ""}}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        ]
    )
    by_category = [
        {"category": d["_id"], "count": d["count"]} async for d in by_category_cursor
    ]
    return {
        "providers": {
            "total": total_providers,
            "approved": approved,
            "pending": pending,
            "rejected": rejected,
            "incomplete": incomplete,
            "by_category": by_category,
        },
        "consumers": {"total": total_users},
        "waitlist": {"total": total_waitlist},
        "marketplace": {"open_requests": marketplace_open, "orders": marketplace_orders},
    }


# ---------------- App startup: create indexes ----------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("phone", unique=False)
    await db.providers.create_index("phone", unique=False)
    await db.providers.create_index("email", unique=False)
    await db.waitlist.create_index([("phone", 1), ("service_interest", 1)])
    await db.provider_documents.create_index(
        [("provider_id", 1), ("document_type", 1)]
    )
    await db.marketplace_requests.create_index([("service_type", 1), ("status", 1), ("created_at", -1)])
    await db.marketplace_quotations.create_index([("request_id", 1), ("provider_id", 1)], unique=True)
    await db.orders.create_index([("customer_id", 1), ("created_at", -1)])
    # Ensure Supabase Storage buckets exist
    if supabase_client:
        for bucket in ALLOWED_BUCKETS:
            try:
                supabase_client.storage.create_bucket(
                    bucket,
                    options={"public": bucket in PUBLIC_BUCKETS},
                )
                logging.info(f"Created Supabase bucket: {bucket}")
            except Exception as e:
                # Already exists is OK
                msg = str(e)
                if "already exists" not in msg.lower() and "duplicate" not in msg.lower():
                    logging.warning(f"Bucket {bucket}: {msg}")
    logging.info("Resqly V1 API ready.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# Mount router and CORS
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
