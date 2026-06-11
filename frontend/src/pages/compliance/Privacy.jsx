import MobileShell from '@/components/MobileShell';

const SECTIONS = [
  { t: '1. Introduction', b: 'This Privacy Policy describes how Resqly Private Limited ("Platform", "we", "us", "our") collects, uses, stores, and protects personal data of users and service providers. By using the Resqly application, you agree to the collection and use of information in accordance with this Privacy Policy.' },
  { t: '2. Applicability', b: 'This Policy applies to Users (patients, customers, pet owners) and Service Providers (doctors, pharmacies, nurses, labs, pet-care providers).' },
  { t: '3. Legal Framework', b: 'This Privacy Policy is aligned with applicable Indian laws including:\n• Information Technology Act, 2000\n• IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011\n• Digital Personal Data Protection Act, 2023 (as applicable).' },
  { t: '4. Information We Collect', b: 'Personal Information: Name, phone number, email address, location details, profile details.\n\nSensitive Personal Data (SPDI): Health-related information, medical history (if provided), prescriptions, consultation details. Collected only with consent and for service delivery.\n\nProvider Information: Professional details, licenses and certifications, identity documents, bank/payment details.\n\nDevice and Usage Data: IP address, device type, app usage data, log information.' },
  { t: '5. Purpose of Data Collection', b: 'We collect and use data for connecting users with service providers, processing bookings and requests, facilitating consultations and services, processing payments, customer support and communication, and improving platform functionality.' },
  { t: '6. Consent', b: 'By using the platform, you provide consent for the collection and processing of personal data, and sharing of data with service providers for service fulfilment. You may withdraw consent by contacting us, subject to legal and operational limitations.' },
  { t: '7. Data Sharing', b: 'We may share data with service providers (doctors, pharmacies, etc.), payment gateway providers, and technical service providers. We do not sell personal data to third parties.' },
  { t: '8. Data Storage and Security', b: 'We implement reasonable security practices as required under Indian law including encryption (where applicable), secure servers, and access control. However, no system is completely secure and users acknowledge this risk.' },
  { t: '9. Data Retention', b: 'We retain personal data as long as necessary for service delivery, to comply with legal obligations, and to resolve disputes. Users may request deletion of their data subject to applicable laws.' },
  { t: '10. User Rights', b: 'Under applicable laws, users have the right to access their data, correct inaccurate data, withdraw consent, and request deletion (subject to legal requirements). Requests can be made via the contact details below.' },
  { t: "11. Children's Privacy", b: 'The platform is not intended for use by minors without parental consent. We do not knowingly collect data from children.' },
  { t: '12. Cookies and Tracking', b: 'We may use cookies or similar technologies to improve user experience and analyze usage patterns. Users can control cookies through device settings.' },
  { t: '13. Third-Party Links', b: 'The platform may contain links to third-party services. We are not responsible for their privacy practices.' },
  { t: '14. Changes to Privacy Policy', b: 'We may update this Privacy Policy from time to time. Users will be notified of significant changes.' },
  { t: '15. Grievance Officer', b: 'In accordance with Indian law, contact for grievances:\nEmail: info@resqly.in\nPhone: 8095404400' },
  { t: '16. Contact', b: 'RESQLY PRIVATE LIMITED\nOM CHAMBERS, 648/A, 4TH FLOOR\nBINNAMANGALA, 1ST STAGE\nINDIRANAGAR\nBANGALORE, KARNATAKA - 560038\nEmail: info@resqly.in\nPhone: 8095404400' },
];

export default function Privacy() {
  return (
    <MobileShell title="Privacy Policy">
      <div className="px-5 py-5 text-slate-700">
        <h2 className="text-xl font-bold text-slate-900">Privacy Policy</h2>
        <p className="text-xs text-slate-500 mt-1">Resqly Private Limited • India-compliant</p>
        <div className="resqly-card p-4 mt-4 bg-blue-50/50 border-blue-100 text-xs">
          We follow the IT Act 2000, SPDI Rules 2011, and the DPDP Act 2023 (as applicable).
        </div>
        <div className="space-y-4 mt-4">
          {SECTIONS.map((s) => (
            <section key={s.t}>
              <h3 className="font-semibold text-slate-900">{s.t}</h3>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-line leading-relaxed">{s.b}</p>
            </section>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
