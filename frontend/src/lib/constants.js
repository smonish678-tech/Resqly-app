export const RESQLY_LOGO_URL = '';

export const PRIMARY_BLUE = '#1E40AF';
export const LIGHT_BLUE = '#3B82F6';

// New consumer service order (8 services). Pet Care consolidates Pet Doctor + Pet Pharmacy.
export const CONSUMER_SERVICES = [
  { key: 'ambulance', label: 'Ambulance', icon: 'Ambulance', bg: '#FEE2E2', fg: '#DC2626' },
  { key: 'bystander', label: 'Bystander', icon: 'Users', bg: '#E0E7FF', fg: '#4F46E5' },
  { key: 'home_care', label: 'Home Care', icon: 'HeartPulse', bg: '#FFEDD5', fg: '#EA580C' },
  { key: 'home_nursing', label: 'Home Nursing', icon: 'Home', bg: '#FCE7F3', fg: '#DB2777' },
  { key: 'lab_test', label: 'Lab Tests', icon: 'FlaskConical', bg: '#EDE9FE', fg: '#7C3AED' },
  { key: 'pharmacy', label: 'Pharmacy', icon: 'Pill', bg: '#D1FAE5', fg: '#059669' },
  { key: 'pet_care', label: 'Pet Care', icon: 'PawPrint', bg: '#FEF3C7', fg: '#D97706' },
  { key: 'doctor', label: 'Doctors', icon: 'Stethoscope', bg: '#E0F2FE', fg: '#0284C7' },
];

// Map legacy service keys to display info for /consumer/service/:key
export const SERVICE_ICONS = {
  doctor: 'Stethoscope',
  pharmacy: 'Pill',
  lab_test: 'FlaskConical',
  ambulance: 'Ambulance',
  home_nursing: 'Home',
  home_care: 'HeartPulse',
  bystander: 'Users',
  pet_doctor: 'PawPrint',
  pet_pharmacy: 'PillBottle',
  pet_care: 'PawPrint',
};

export const SERVICE_COLORS = {
  doctor: { bg: '#E0F2FE', fg: '#0284C7' },
  pharmacy: { bg: '#D1FAE5', fg: '#059669' },
  lab_test: { bg: '#EDE9FE', fg: '#7C3AED' },
  ambulance: { bg: '#FEE2E2', fg: '#DC2626' },
  home_nursing: { bg: '#FCE7F3', fg: '#DB2777' },
  home_care: { bg: '#FFEDD5', fg: '#EA580C' },
  bystander: { bg: '#E0E7FF', fg: '#4F46E5' },
  pet_doctor: { bg: '#FEF3C7', fg: '#D97706' },
  pet_pharmacy: { bg: '#CCFBF1', fg: '#0D9488' },
  pet_care: { bg: '#FEF3C7', fg: '#D97706' },
};

export const SERVICE_LABELS = {
  doctor: 'Doctors',
  pharmacy: 'Pharmacy',
  lab_test: 'Lab Tests',
  ambulance: 'Ambulance',
  home_nursing: 'Home Nursing',
  home_care: 'Home Care',
  bystander: 'Bystander',
  pet_doctor: 'Pet Doctor',
  pet_pharmacy: 'Pet Pharmacy',
  pet_care: 'Pet Care',
};

export const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Kochi', 'Ahmedabad', 'Jaipur'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const LANGUAGE_OPTIONS = ['English', 'Kannada', 'Hindi', 'Tamil', 'Telugu', 'Malayalam'];

export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'];
export const SMOKING_OPTIONS = ['Never', 'Occasionally', 'Regularly', 'Trying to quit', 'Quit'];
export const ALCOHOL_OPTIONS = ['Never', 'Occasionally', 'Socially', 'Regularly', 'Quit'];
export const ACTIVITY_OPTIONS = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Athletic'];
export const FOOD_OPTIONS = ['Vegetarian', 'Vegan', 'Eggetarian', 'Non-vegetarian', 'Jain'];
export const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Dependent', 'Other'];
