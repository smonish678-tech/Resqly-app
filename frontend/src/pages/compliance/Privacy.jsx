import MobileShell from '@/components/MobileShell';

export default function Privacy() {
  return (
    <MobileShell title="Privacy Policy">
      <div className="px-5 py-5 prose prose-sm max-w-none text-slate-700">
        <h2 className="text-lg font-bold text-slate-900">Privacy Policy</h2>
        <p className="text-xs text-slate-500">Last updated: 2026</p>
        <p>Resqly ("we", "our", "us") respects your privacy. This Privacy Policy explains how we collect, use, store, and disclose your information when you use the Resqly mobile applications and related services.</p>
        <h3 className="font-semibold text-slate-900 mt-4">Information We Collect</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Identifiers: name, phone number, email address.</li>
          <li>Location: city and approximate location (only while using the app, with permission).</li>
          <li>Health & emergency data: blood group, allergies, medical conditions, emergency contacts (entered by you).</li>
          <li>Provider data: KYC documents (Aadhaar, licenses, certificates) for verification.</li>
        </ul>
        <h3 className="font-semibold text-slate-900 mt-4">How We Use Your Data</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>To authenticate users via OTP and email/password.</li>
          <li>To enable emergency response and direct first responders to your information when needed.</li>
          <li>To verify provider credentials before granting marketplace access.</li>
          <li>To send service-related notifications and updates.</li>
        </ul>
        <h3 className="font-semibold text-slate-900 mt-4">Data Storage & Security</h3>
        <p>We store your data on secure servers and apply encryption in transit. KYC documents are restricted to authorised verification staff.</p>
        <h3 className="font-semibold text-slate-900 mt-4">Your Rights</h3>
        <p>You may request deletion of your account and personal data at any time via Profile → Delete Account, or by emailing privacy@resqly.in.</p>
        <h3 className="font-semibold text-slate-900 mt-4">Contact</h3>
        <p>For privacy concerns: privacy@resqly.in</p>
      </div>
    </MobileShell>
  );
}
