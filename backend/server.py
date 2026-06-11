"""
Resqly V1 Backend - FastAPI + MongoDB
Provider Acquisition Platform & Consumer Pre-Launch Platform
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------- Config ----------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALG = "HS256"
JWT_EXPIRE_DAYS = 30
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")
MOCK_OTP = "123456"

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


class ProviderCategoryUpdate(BaseModel):
    category: str


class ProviderProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    service_area: Optional[str] = None
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


# ---------------- Auth (Mock OTP) ----------------
@api.post("/auth/otp/request")
async def request_otp(payload: OTPRequest):
    """Request OTP. Returns the mock OTP for V1 (no SMS gateway)."""
    if payload.role not in ("consumer", "provider"):
        raise HTTPException(status_code=400, detail="Invalid role")
    # Save the OTP record (in real prod we'd persist + send SMS)
    await db.otp_requests.insert_one(
        {
            "id": new_id(),
            "phone": payload.phone,
            "role": payload.role,
            "otp": MOCK_OTP,
            "created_at": now_iso(),
        }
    )
    return {
        "success": True,
        "message": f"OTP sent to {payload.phone}",
        "mock_otp": MOCK_OTP,  # exposed for V1 pre-launch
    }


@api.post("/auth/otp/verify")
async def verify_otp(payload: OTPVerify):
    if payload.otp != MOCK_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
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
    # Only approved providers can go available/busy
    doc = await db.providers.find_one({"id": user["id"]}, {"_id": 0})
    if (
        doc.get("approval_status") != "approved"
        and payload.availability_status != "offline"
    ):
        raise HTTPException(
            status_code=400, detail="You must be approved before going available"
        )
    await db.providers.update_one(
        {"id": user["id"]},
        {"$set": {"availability_status": payload.availability_status}},
    )
    return {"success": True, "availability_status": payload.availability_status}


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
        {"provider_id": user["id"], "status": "completed"}, {"_id": 0}
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


# ---------------- Admin (Hidden) ----------------
@api.post("/admin/login")
async def admin_login(payload: AdminLogin):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
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
