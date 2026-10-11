export const RESQLY_LOGO_URL = '';

export const PRIMARY_BLUE = '#1E40AF';
export const LIGHT_BLUE = '#3B82F6';

// Core service discovery order is a product requirement: safety and in-home help first.
export const CONSUMER_SERVICES = [
  { key: 'ambulance', label: 'Ambulance', subtitle: 'Immediate help: call 108', availability: 'Call 108', availabilityKind: 'urgent', icon: 'Ambulance', bg: '#FEE2E2', fg: '#B91C1C' },
  { key: 'bystander', label: 'Bystander', subtitle: 'Support at home or hospital', availability: 'Coming soon', availabilityKind: 'soon', icon: 'Users', bg: '#E0E7FF', fg: '#4338CA' },
  { key: 'home_care', label: 'Home Care', subtitle: 'Everyday care, at home', availability: 'Coming soon', availabilityKind: 'soon', icon: 'HeartPulse', bg: '#FFEDD5', fg: '#C2410C' },
  { key: 'home_nursing', label: 'Home Nursing', subtitle: 'Nursing support at home', availability: 'Coming soon', availabilityKind: 'soon', icon: 'House', bg: '#FCE7F3', fg: '#BE185D' },
  { key: 'doctor', label: 'Doctors', subtitle: 'Consultation options', availability: 'Join waitlist', availabilityKind: 'waitlist', icon: 'Stethoscope', bg: '#DBEAFE', fg: '#1D4ED8' },
  { key: 'pharmacy', label: 'Pharmacy', subtitle: 'Compare medicine offers', availability: 'Request offers', availabilityKind: 'active', icon: 'Pill', bg: '#D1FAE5', fg: '#047857' },
  { key: 'lab_test', label: 'Lab Tests', subtitle: 'Compare testing options', availability: 'Request offers', availabilityKind: 'active', icon: 'FlaskConical', bg: '#EDE9FE', fg: '#6D28D9' },
  { key: 'pet_care', label: 'Pet Care', subtitle: 'Care for your companion', availability: 'Coming soon', availabilityKind: 'soon', icon: 'PawPrint', bg: '#FEF3C7', fg: '#B45309' },
];

export const SERVICE_ICONS = {
  doctor: 'Stethoscope', pharmacy: 'Pill', lab_test: 'FlaskConical', ambulance: 'Ambulance',
  home_nursing: 'House', home_care: 'HeartPulse', bystander: 'Users', pet_doctor: 'PawPrint',
  pet_pharmacy: 'PillBottle', pet_care: 'PawPrint',
};

export const SERVICE_COLORS = {
  doctor: { bg: '#DBEAFE', fg: '#1D4ED8' },
  pharmacy: { bg: '#D1FAE5', fg: '#047857' },
  lab_test: { bg: '#EDE9FE', fg: '#6D28D9' },
  ambulance: { bg: '#FEE2E2', fg: '#B91C1C' },
  home_nursing: { bg: '#FCE7F3', fg: '#BE185D' },
  home_care: { bg: '#FFEDD5', fg: '#C2410C' },
  bystander: { bg: '#E0E7FF', fg: '#4338CA' },
  pet_doctor: { bg: '#FEF3C7', fg: '#B45309' },
  pet_pharmacy: { bg: '#CCFBF1', fg: '#0F766E' },
  pet_care: { bg: '#FEF3C7', fg: '#B45309' },
};

export const SERVICE_LABELS = {
  doctor: 'Doctors', pharmacy: 'Pharmacy', lab_test: 'Lab Tests', ambulance: 'Ambulance',
  home_nursing: 'Home Nursing', home_care: 'Home Care', bystander: 'Bystander',
  pet_doctor: 'Pet Doctor', pet_pharmacy: 'Pet Pharmacy', pet_care: 'Pet Care',
};

export const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Kochi', 'Ahmedabad', 'Jaipur'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const LANGUAGE_OPTIONS = ['Arabic', 'Bengali', 'Chinese (Mandarin)', 'English', 'French', 'German', 'Gujarati', 'Hindi', 'Indonesian', 'Japanese', 'Kannada', 'Korean', 'Malayalam', 'Marathi', 'Odia', 'Persian', 'Portuguese', 'Punjabi', 'Russian', 'Spanish', 'Swahili', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Urdu', 'Vietnamese'];

export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'];
export const SMOKING_OPTIONS = ['Never', 'Occasionally', 'Regularly', 'Trying to quit', 'Quit'];
export const ALCOHOL_OPTIONS = ['Never', 'Occasionally', 'Socially', 'Regularly', 'Quit'];
export const ACTIVITY_OPTIONS = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Athletic'];
export const FOOD_OPTIONS = ['Vegetarian', 'Vegan', 'Eggetarian', 'Non-vegetarian', 'Jain'];
export const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Dependent', 'Other'];
