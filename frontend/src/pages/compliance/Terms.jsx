import MobileShell from '@/components/MobileShell';

export default function Terms() {
  return (
    <MobileShell title="Terms & Conditions">
      <div className="px-5 py-5 prose prose-sm max-w-none text-slate-700">
        <h2 className="text-lg font-bold text-slate-900">Terms & Conditions</h2>
        <p className="text-xs text-slate-500">Last updated: 2026</p>
        <p>By accessing or using the Resqly applications ("Service"), you agree to be bound by these Terms.</p>
        <h3 className="font-semibold text-slate-900 mt-4">Service Description</h3>
        <p>Resqly is a healthcare provider acquisition and consumer pre-launch platform. The marketplace, dispatch, and payment services are not live in this version.</p>
        <h3 className="font-semibold text-slate-900 mt-4">User Accounts</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>You must provide accurate information.</li>
          <li>You are responsible for all activities under your account.</li>
          <li>Providers must hold valid licenses for their stated category.</li>
        </ul>
        <h3 className="font-semibold text-slate-900 mt-4">Provider Approval</h3>
        <p>Resqly reviews provider applications and may approve, reject, or request resubmission based on the authenticity of submitted KYC documents.</p>
        <h3 className="font-semibold text-slate-900 mt-4">Prohibited Use</h3>
        <p>You agree not to misuse the Service, upload false credentials, or violate any applicable law.</p>
        <h3 className="font-semibold text-slate-900 mt-4">Termination</h3>
        <p>We may suspend or terminate accounts that violate these Terms.</p>
        <h3 className="font-semibold text-slate-900 mt-4">Contact</h3>
        <p>legal@resqly.in</p>
      </div>
    </MobileShell>
  );
}
