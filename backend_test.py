"""
Resqly V1 Backend API Tests
Tests all 19 user stories covering consumer, provider, and admin flows
"""
import requests
import sys
import random
from datetime import datetime

BASE_URL = "https://resqly-launch.preview.emergentagent.com/api"
MOCK_OTP = "123456"
ADMIN_PASSWORD = "resqly-admin-2026"

class ResqlyTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.consumer_token = None
        self.consumer_phone = None
        self.provider_token = None
        self.provider_id = None
        self.provider_email = None
        self.admin_token = None
        
    def log(self, msg, status="info"):
        prefix = {"info": "ℹ️", "pass": "✅", "fail": "❌", "warn": "⚠️"}
        print(f"{prefix.get(status, 'ℹ️')} {msg}")
    
    def test(self, name, func):
        """Run a test and track results"""
        self.tests_run += 1
        self.log(f"Testing: {name}", "info")
        try:
            func()
            self.tests_passed += 1
            self.log(f"PASSED: {name}", "pass")
            return True
        except AssertionError as e:
            self.log(f"FAILED: {name} - {str(e)}", "fail")
            return False
        except Exception as e:
            self.log(f"ERROR: {name} - {str(e)}", "fail")
            return False
    
    def random_phone(self):
        """Generate unique 10-digit phone number"""
        return f"9{random.randint(100000000, 999999999)}"
    
    def random_email(self):
        """Generate unique email"""
        return f"provider_{random.randint(10000, 99999)}@test.com"
    
    # ========== CONSUMER TESTS ==========
    
    def test_consumer_otp_request(self):
        """USER STORY 2: Consumer can request OTP"""
        self.consumer_phone = self.random_phone()
        r = requests.post(f"{BASE_URL}/auth/otp/request", json={
            "phone": self.consumer_phone,
            "role": "consumer"
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("mock_otp") == MOCK_OTP, "Mock OTP not returned"
        self.log(f"Consumer phone: {self.consumer_phone}")
    
    def test_consumer_otp_verify_new(self):
        """USER STORY 2: New consumer OTP verify creates account"""
        r = requests.post(f"{BASE_URL}/auth/otp/verify", json={
            "phone": self.consumer_phone,
            "otp": MOCK_OTP,
            "role": "consumer"
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "token" in data, "Token not returned"
        assert data.get("is_new") == True, "Should be new user"
        self.consumer_token = data["token"]
        self.log(f"Consumer token obtained")
    
    def test_consumer_onboarding(self):
        """USER STORY 3: Consumer onboarding saves profile"""
        r = requests.patch(f"{BASE_URL}/users/me", 
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "name": "Test Consumer",
                "city": "Bangalore",
                "blood_group": "O+",
                "preferred_hospital": "Manipal Hospital"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["user"]["name"] == "Test Consumer", "Name not saved"
        assert data["user"]["city"] == "Bangalore", "City not saved"
    
    def test_consumer_emergency_profile(self):
        """USER STORY 7: Emergency profile saves and persists"""
        # Save emergency data
        r = requests.patch(f"{BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "blood_group": "A+",
                "allergies": ["Penicillin", "Peanuts"],
                "medical_conditions": ["Diabetes"],
                "preferred_hospital": "Apollo Hospital",
                "emergency_contacts": [
                    {"name": "John Doe", "phone": "9876543210", "relation": "Father"},
                    {"name": "Jane Doe", "phone": "9876543211", "relation": "Mother"}
                ]
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Verify persistence by fetching
        r2 = requests.get(f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r2.status_code == 200
        user = r2.json()["user"]
        assert user["blood_group"] == "A+", "Blood group not persisted"
        assert len(user["emergency_contacts"]) == 2, "Emergency contacts not persisted"
        assert "Penicillin" in user["allergies"], "Allergies not persisted"
    
    def test_consumer_waitlist(self):
        """USER STORY 8: Waitlist submission works"""
        r = requests.post(f"{BASE_URL}/waitlist", json={
            "name": "Test User",
            "phone": self.random_phone(),
            "city": "Bangalore",
            "location": "Koramangala",
            "service_interest": "doctor"
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("success") == True, "Waitlist submission failed"
    
    def test_services_endpoint(self):
        """USER STORY 4: Services endpoint returns 9 services"""
        r = requests.get(f"{BASE_URL}/services")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        services = r.json()["services"]
        assert len(services) == 9, f"Expected 9 services, got {len(services)}"
        service_keys = [s["key"] for s in services]
        expected = ["doctor", "pharmacy", "lab_test", "ambulance", "home_nursing", "home_care", "bystander", "pet_doctor", "pet_pharmacy"]
        for key in expected:
            assert key in service_keys, f"Service {key} not found"
    
    # ========== PROVIDER TESTS (Phone OTP) ==========
    
    def test_provider_otp_flow(self):
        """USER STORY 9: Provider phone OTP login"""
        phone = self.random_phone()
        
        # Request OTP
        r = requests.post(f"{BASE_URL}/auth/otp/request", json={
            "phone": phone,
            "role": "provider"
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json().get("mock_otp") == MOCK_OTP
        
        # Verify OTP
        r2 = requests.post(f"{BASE_URL}/auth/otp/verify", json={
            "phone": phone,
            "otp": MOCK_OTP,
            "role": "provider"
        })
        assert r2.status_code == 200
        data = r2.json()
        assert "token" in data
        assert data.get("is_new") == True
        self.log(f"Provider OTP flow successful")
    
    # ========== PROVIDER TESTS (Email) ==========
    
    def test_provider_email_register(self):
        """USER STORY 9: Provider email registration"""
        self.provider_email = self.random_email()
        r = requests.post(f"{BASE_URL}/auth/provider/register", json={
            "email": self.provider_email,
            "password": "TestPass123!",
            "name": "Dr. Test Provider"
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "token" in data, "Token not returned"
        assert data.get("is_new") == True
        self.provider_token = data["token"]
        self.provider_id = data["provider"]["id"]
        self.log(f"Provider registered: {self.provider_email}")
    
    def test_provider_email_login(self):
        """USER STORY 9: Provider email login"""
        r = requests.post(f"{BASE_URL}/auth/provider/login", json={
            "email": self.provider_email,
            "password": "TestPass123!"
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "token" in data
        assert data.get("is_new") == False
        self.log("Provider login successful")
    
    def test_provider_forgot_password(self):
        """USER STORY 9: Provider forgot password returns reset token"""
        r = requests.post(f"{BASE_URL}/auth/provider/forgot-password", json={
            "email": self.provider_email
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "reset_token" in data, "Reset token not returned"
        self.reset_token = data["reset_token"]
        self.log(f"Reset token: {self.reset_token}")
    
    def test_provider_reset_password(self):
        """USER STORY 9: Provider reset password works"""
        r = requests.post(f"{BASE_URL}/auth/provider/reset-password", json={
            "email": self.provider_email,
            "reset_token": self.reset_token,
            "new_password": "NewPass456!"
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Verify new password works
        r2 = requests.post(f"{BASE_URL}/auth/provider/login", json={
            "email": self.provider_email,
            "password": "NewPass456!"
        })
        assert r2.status_code == 200, "New password login failed"
        self.provider_token = r2.json()["token"]
    
    def test_provider_category_selection(self):
        """USER STORY 10: Provider selects category"""
        r = requests.patch(f"{BASE_URL}/providers/me/category",
            headers={"Authorization": f"Bearer {self.provider_token}"},
            json={"category": "doctor"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["provider"]["category"] == "doctor"
        assert "kyc_required" in data["provider"]
        assert len(data["provider"]["kyc_required"]) > 0
    
    def test_provider_kyc_basic_info(self):
        """USER STORY 11: Provider fills basic info"""
        r = requests.patch(f"{BASE_URL}/providers/me",
            headers={"Authorization": f"Bearer {self.provider_token}"},
            json={
                "name": "Dr. John Smith",
                "city": "Bangalore",
                "service_area": "Koramangala, HSR Layout"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["provider"]["name"] == "Dr. John Smith"
    
    def test_provider_document_upload(self):
        """USER STORY 11: Provider uploads documents"""
        # Upload a mock base64 document
        mock_doc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        r = requests.post(f"{BASE_URL}/providers/me/documents",
            headers={"Authorization": f"Bearer {self.provider_token}"},
            json={
                "document_type": "Aadhaar",
                "document_url": mock_doc,
                "file_name": "aadhaar.png"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("success") == True
        assert data["document"]["document_type"] == "Aadhaar"
    
    def test_provider_submit_incomplete(self):
        """USER STORY 11: Submit fails if docs missing"""
        r = requests.post(f"{BASE_URL}/providers/me/submit",
            headers={"Authorization": f"Bearer {self.provider_token}"}
        )
        # Should fail because not all required docs uploaded
        assert r.status_code == 400, f"Expected 400 for incomplete docs, got {r.status_code}"
    
    def test_provider_upload_all_docs_and_submit(self):
        """USER STORY 11 & 12: Upload all required docs and submit"""
        # Get required docs for doctor category
        r = requests.get(f"{BASE_URL}/providers/me",
            headers={"Authorization": f"Bearer {self.provider_token}"}
        )
        required = r.json()["provider"]["kyc_required"]
        
        mock_doc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        # Upload all required docs
        for doc_type in required:
            r = requests.post(f"{BASE_URL}/providers/me/documents",
                headers={"Authorization": f"Bearer {self.provider_token}"},
                json={
                    "document_type": doc_type,
                    "document_url": mock_doc,
                    "file_name": f"{doc_type}.png"
                }
            )
            assert r.status_code == 200, f"Failed to upload {doc_type}"
        
        # Now submit should work
        r = requests.post(f"{BASE_URL}/providers/me/submit",
            headers={"Authorization": f"Bearer {self.provider_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("approval_status") == "pending"
    
    def test_provider_availability_before_approval(self):
        """USER STORY 15: Provider cannot go available before approval"""
        r = requests.patch(f"{BASE_URL}/providers/me/availability",
            headers={"Authorization": f"Bearer {self.provider_token}"},
            json={"availability_status": "available"}
        )
        # Should fail because not approved yet
        assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    
    def test_provider_profile_update(self):
        """USER STORY 17: Provider profile editing"""
        r = requests.patch(f"{BASE_URL}/providers/me",
            headers={"Authorization": f"Bearer {self.provider_token}"},
            json={
                "description": "Experienced doctor with 10 years practice",
                "languages": ["English", "Hindi", "Kannada"],
                "specialization": ["General Physician", "Pediatrician"],
                "bank_account_holder": "Dr. John Smith",
                "bank_account_number": "1234567890",
                "bank_ifsc": "HDFC0001234",
                "bank_name": "HDFC Bank"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "profile_completion" in data["provider"]
        assert data["provider"]["profile_completion"] > 0
    
    def test_provider_orders_empty(self):
        """USER STORY 16: Provider orders shows empty state"""
        r = requests.get(f"{BASE_URL}/providers/me/orders",
            headers={"Authorization": f"Bearer {self.provider_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "orders" in data
        assert len(data["orders"]) == 0
    
    def test_provider_earnings_empty(self):
        """USER STORY 16: Provider earnings shows empty state"""
        r = requests.get(f"{BASE_URL}/providers/me/earnings",
            headers={"Authorization": f"Bearer {self.provider_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["today"] == 0
        assert data["monthly"] == 0
        assert data["lifetime"] == 0
    
    def test_provider_reviews_empty(self):
        """USER STORY 16: Provider reviews shows empty state"""
        r = requests.get(f"{BASE_URL}/providers/me/reviews",
            headers={"Authorization": f"Bearer {self.provider_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "reviews" in data
        assert len(data["reviews"]) == 0
    
    # ========== ADMIN TESTS ==========
    
    def test_admin_login(self):
        """USER STORY 13: Admin login with password"""
        r = requests.post(f"{BASE_URL}/admin/login", json={
            "password": ADMIN_PASSWORD
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "token" in data
        self.admin_token = data["token"]
        self.log("Admin login successful")
    
    def test_admin_stats(self):
        """USER STORY 13: Admin dashboard shows stats"""
        r = requests.get(f"{BASE_URL}/admin/stats",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "providers" in data
        assert "consumers" in data
        assert "waitlist" in data
    
    def test_admin_list_providers_pending(self):
        """USER STORY 13: Admin can filter pending providers"""
        r = requests.get(f"{BASE_URL}/admin/providers?status=pending",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "providers" in data
        # Our test provider should be in pending list
        provider_ids = [p["id"] for p in data["providers"]]
        assert self.provider_id in provider_ids, "Test provider not in pending list"
    
    def test_admin_get_provider_detail(self):
        """USER STORY 13: Admin can view provider details"""
        r = requests.get(f"{BASE_URL}/admin/providers/{self.provider_id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "provider" in data
        assert "documents" in data
        assert data["provider"]["id"] == self.provider_id
    
    def test_admin_approve_provider(self):
        """USER STORY 13 & 14: Admin approves provider"""
        r = requests.post(f"{BASE_URL}/admin/providers/{self.provider_id}/decision",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={
                "status": "approved",
                "reason": "All documents verified"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("approval_status") == "approved"
        
        # Verify provider status changed
        r2 = requests.get(f"{BASE_URL}/providers/me",
            headers={"Authorization": f"Bearer {self.provider_token}"}
        )
        assert r2.json()["provider"]["approval_status"] == "approved"
    
    def test_provider_availability_after_approval(self):
        """USER STORY 15: Approved provider can change availability"""
        # Test Available
        r = requests.patch(f"{BASE_URL}/providers/me/availability",
            headers={"Authorization": f"Bearer {self.provider_token}"},
            json={"availability_status": "available"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test Busy
        r = requests.patch(f"{BASE_URL}/providers/me/availability",
            headers={"Authorization": f"Bearer {self.provider_token}"},
            json={"availability_status": "busy"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test Offline
        r = requests.patch(f"{BASE_URL}/providers/me/availability",
            headers={"Authorization": f"Bearer {self.provider_token}"},
            json={"availability_status": "offline"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    def test_admin_reject_provider(self):
        """USER STORY 13: Admin can reject provider"""
        # Create another provider to reject
        email = self.random_email()
        r = requests.post(f"{BASE_URL}/auth/provider/register", json={
            "email": email,
            "password": "Test123!",
            "name": "Test Reject"
        })
        token = r.json()["token"]
        provider_id = r.json()["provider"]["id"]
        
        # Set category and submit
        requests.patch(f"{BASE_URL}/providers/me/category",
            headers={"Authorization": f"Bearer {token}"},
            json={"category": "pharmacy"}
        )
        
        # Admin rejects
        r = requests.post(f"{BASE_URL}/admin/providers/{provider_id}/decision",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={
                "status": "rejected",
                "reason": "Invalid documents"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    def test_admin_resubmit_provider(self):
        """USER STORY 13: Admin can request resubmit"""
        # Create another provider
        email = self.random_email()
        r = requests.post(f"{BASE_URL}/auth/provider/register", json={
            "email": email,
            "password": "Test123!",
            "name": "Test Resubmit"
        })
        token = r.json()["token"]
        provider_id = r.json()["provider"]["id"]
        
        # Admin requests resubmit
        r = requests.post(f"{BASE_URL}/admin/providers/{provider_id}/decision",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={
                "status": "resubmit",
                "reason": "Please upload clearer photos"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    def test_delete_account_request(self):
        """USER STORY 19: Delete account request submission"""
        r = requests.post(f"{BASE_URL}/delete-account/request",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "reason": "Testing deletion flow",
                "contact_email": "test@example.com"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("success") == True
    
    # ========== NEW V1 REFINEMENT TESTS ==========
    
    def test_extended_profile_fields(self):
        """V1 REFINEMENT: Extended profile fields (Personal/Medical/Lifestyle)"""
        r = requests.patch(f"{BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "gender": "Male",
                "dob": "1990-05-15",
                "marital_status": "Single",
                "height_cm": 175.5,
                "weight_kg": 70.0,
                "current_medications": ["Aspirin", "Vitamin D"],
                "past_medications": ["Paracetamol"],
                "chronic_diseases": ["Hypertension"],
                "injuries": ["Knee injury 2020"],
                "surgeries": ["Appendectomy 2015"],
                "smoking_habits": "Never",
                "alcohol_consumption": "Occasionally",
                "activity_level": "Moderately active",
                "food_preference": "Vegetarian",
                "occupation": "Software Engineer"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        user = data["user"]
        assert user["gender"] == "Male", "Gender not saved"
        assert user["dob"] == "1990-05-15", "DOB not saved"
        assert user["marital_status"] == "Single", "Marital status not saved"
        assert user["height_cm"] == 175.5, "Height not saved"
        assert user["weight_kg"] == 70.0, "Weight not saved"
        assert "Aspirin" in user["current_medications"], "Current medications not saved"
        assert user["smoking_habits"] == "Never", "Smoking habits not saved"
        assert user["occupation"] == "Software Engineer", "Occupation not saved"
        assert "profile_completion" in user, "Profile completion not returned"
        self.log(f"Profile completion: {user['profile_completion']}%")
    
    def test_family_members_crud(self):
        """V1 REFINEMENT: Family members CRUD operations"""
        # Create family member
        r = requests.post(f"{BASE_URL}/users/me/family",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "name": "Jane Doe",
                "relation": "Spouse",
                "phone": "9876543210",
                "dob": "1992-08-20",
                "gender": "Female",
                "blood_group": "B+",
                "medical_notes": "Allergic to penicillin"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        member = r.json()["member"]
        member_id = member["id"]
        assert member["name"] == "Jane Doe", "Member name not saved"
        assert member["relation"] == "Spouse", "Relation not saved"
        
        # List family members
        r = requests.get(f"{BASE_URL}/users/me/family",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        members = r.json()["members"]
        assert len(members) >= 1, "Family member not in list"
        
        # Update family member (need to send all required fields due to model validation)
        r = requests.patch(f"{BASE_URL}/users/me/family/{member_id}",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "name": "Jane Doe",
                "relation": "Spouse",
                "medical_notes": "Updated notes"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Delete family member
        r = requests.delete(f"{BASE_URL}/users/me/family/{member_id}",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json().get("success") == True
    
    def test_prescriptions_crud(self):
        """V1 REFINEMENT: Prescriptions CRUD operations"""
        # Create prescription
        r = requests.post(f"{BASE_URL}/users/me/prescriptions",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "doctor_name": "Dr. Smith",
                "title": "Cold & Cough",
                "date": "2025-08-15",
                "notes": "Take after meals",
                "image_url": "data:image/png;base64,test"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        presc = r.json()["prescription"]
        presc_id = presc["id"]
        assert presc["doctor_name"] == "Dr. Smith", "Doctor name not saved"
        
        # List prescriptions
        r = requests.get(f"{BASE_URL}/users/me/prescriptions",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        items = r.json()["prescriptions"]
        assert len(items) >= 1, "Prescription not in list"
        
        # Delete prescription
        r = requests.delete(f"{BASE_URL}/users/me/prescriptions/{presc_id}",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json().get("success") == True
    
    def test_lab_tests_crud(self):
        """V1 REFINEMENT: Lab tests CRUD operations"""
        # Create upcoming test
        r = requests.post(f"{BASE_URL}/users/me/lab-tests",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "test_name": "Complete Blood Count",
                "status": "upcoming",
                "scheduled_date": "2025-09-01",
                "lab_name": "Apollo Diagnostics",
                "notes": "Fasting required"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        test = r.json()["test"]
        test_id = test["id"]
        assert test["test_name"] == "Complete Blood Count", "Test name not saved"
        assert test["status"] == "upcoming", "Status not saved"
        
        # List lab tests
        r = requests.get(f"{BASE_URL}/users/me/lab-tests",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        tests = r.json()["tests"]
        assert len(tests) >= 1, "Lab test not in list"
        
        # Update lab test (need to send all required fields due to model validation)
        r = requests.patch(f"{BASE_URL}/users/me/lab-tests/{test_id}",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "test_name": "Complete Blood Count",
                "status": "past"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Delete lab test
        r = requests.delete(f"{BASE_URL}/users/me/lab-tests/{test_id}",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json().get("success") == True
    
    def test_lab_reports_crud(self):
        """V1 REFINEMENT: Lab reports CRUD operations"""
        # Create report
        r = requests.post(f"{BASE_URL}/users/me/lab-reports",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "title": "Blood Test Report",
                "test_name": "CBC",
                "lab_name": "Apollo",
                "date": "2025-08-10",
                "file_url": "data:image/png;base64,test"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        report = r.json()["report"]
        report_id = report["id"]
        assert report["title"] == "Blood Test Report", "Title not saved"
        
        # List reports
        r = requests.get(f"{BASE_URL}/users/me/lab-reports",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        reports = r.json()["reports"]
        assert len(reports) >= 1, "Report not in list"
        
        # Delete report
        r = requests.delete(f"{BASE_URL}/users/me/lab-reports/{report_id}",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json().get("success") == True
    
    def test_emergency_request(self):
        """V1 REFINEMENT: Emergency ambulance request (design only)"""
        # Create emergency request
        r = requests.post(f"{BASE_URL}/emergency/request",
            headers={"Authorization": f"Bearer {self.consumer_token}"},
            json={
                "latitude": 12.9716,
                "longitude": 77.5946,
                "address": "Koramangala, Bangalore",
                "notes": "Chest pain, urgent",
                "type": "ambulance"
            }
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("success") == True, "Request not successful"
        request = data["request"]
        assert request["status"] == "logged", "Status should be 'logged'"
        assert "candidate_provider_count" in request, "Candidate count not returned"
        self.log(f"Emergency request logged with {request['candidate_provider_count']} candidates")
        
        # List emergency requests
        r = requests.get(f"{BASE_URL}/emergency/requests",
            headers={"Authorization": f"Bearer {self.consumer_token}"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        requests_list = r.json()["requests"]
        assert len(requests_list) >= 1, "Emergency request not in list"
    
    def run_all(self):
        """Run all tests in sequence"""
        print("\n" + "="*60)
        print("🚀 RESQLY V1 BACKEND API TESTS")
        print("="*60 + "\n")
        
        # Consumer tests
        print("\n📱 CONSUMER TESTS")
        print("-" * 60)
        self.test("Consumer OTP Request", self.test_consumer_otp_request)
        self.test("Consumer OTP Verify (New User)", self.test_consumer_otp_verify_new)
        self.test("Consumer Onboarding", self.test_consumer_onboarding)
        self.test("Consumer Emergency Profile", self.test_consumer_emergency_profile)
        self.test("Consumer Waitlist", self.test_consumer_waitlist)
        self.test("Services Endpoint (9 services)", self.test_services_endpoint)
        
        # Provider tests
        print("\n🏥 PROVIDER TESTS")
        print("-" * 60)
        self.test("Provider OTP Flow", self.test_provider_otp_flow)
        self.test("Provider Email Register", self.test_provider_email_register)
        self.test("Provider Email Login", self.test_provider_email_login)
        self.test("Provider Forgot Password", self.test_provider_forgot_password)
        self.test("Provider Reset Password", self.test_provider_reset_password)
        self.test("Provider Category Selection", self.test_provider_category_selection)
        self.test("Provider KYC Basic Info", self.test_provider_kyc_basic_info)
        self.test("Provider Document Upload", self.test_provider_document_upload)
        self.test("Provider Submit Incomplete (Should Fail)", self.test_provider_submit_incomplete)
        self.test("Provider Upload All Docs & Submit", self.test_provider_upload_all_docs_and_submit)
        self.test("Provider Availability Before Approval (Should Fail)", self.test_provider_availability_before_approval)
        self.test("Provider Profile Update", self.test_provider_profile_update)
        self.test("Provider Orders (Empty State)", self.test_provider_orders_empty)
        self.test("Provider Earnings (Empty State)", self.test_provider_earnings_empty)
        self.test("Provider Reviews (Empty State)", self.test_provider_reviews_empty)
        
        # Admin tests
        print("\n🔐 ADMIN TESTS")
        print("-" * 60)
        self.test("Admin Login", self.test_admin_login)
        self.test("Admin Stats", self.test_admin_stats)
        self.test("Admin List Pending Providers", self.test_admin_list_providers_pending)
        self.test("Admin Get Provider Detail", self.test_admin_get_provider_detail)
        self.test("Admin Approve Provider", self.test_admin_approve_provider)
        self.test("Provider Availability After Approval", self.test_provider_availability_after_approval)
        self.test("Admin Reject Provider", self.test_admin_reject_provider)
        self.test("Admin Resubmit Provider", self.test_admin_resubmit_provider)
        
        # Compliance tests
        print("\n📋 COMPLIANCE TESTS")
        print("-" * 60)
        self.test("Delete Account Request", self.test_delete_account_request)
        
        # V1 Refinement tests
        print("\n🆕 V1 REFINEMENT TESTS (New Features)")
        print("-" * 60)
        self.test("Extended Profile Fields", self.test_extended_profile_fields)
        self.test("Family Members CRUD", self.test_family_members_crud)
        self.test("Prescriptions CRUD", self.test_prescriptions_crud)
        self.test("Lab Tests CRUD", self.test_lab_tests_crud)
        self.test("Lab Reports CRUD", self.test_lab_reports_crud)
        self.test("Emergency Request (Design Only)", self.test_emergency_request)
        
        # Summary
        print("\n" + "="*60)
        print(f"📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed} ✅")
        print(f"Failed: {self.tests_run - self.tests_passed} ❌")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print("="*60 + "\n")
        
        return 0 if self.tests_passed == self.tests_run else 1

if __name__ == "__main__":
    tester = ResqlyTester()
    sys.exit(tester.run_all())
