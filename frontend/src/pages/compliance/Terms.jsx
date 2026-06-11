import MobileShell from '@/components/MobileShell';

const SECTIONS = [
  { t: '1. Introduction', b: 'These Terms & Conditions ("Terms") govern your access to and use of the Resqly mobile application, website, services, and all related technology platforms operated by Resqly Private Limited. By downloading, registering, accessing, or using Resqly, you agree to comply with and be legally bound by these Terms. If you do not agree with any part of these Terms, please do not use the Platform.' },
  { t: '2. About Resqly', b: 'Resqly is a technology platform that connects users with nearby service providers, emergency support providers, and independent professionals for assistance and support services. Resqly acts solely as a technology facilitator and intermediary platform. Resqly does not directly provide medical treatment, ambulance services, healthcare advice, emergency response operations, or professional consultation unless explicitly stated. All services provided through the Platform are independently delivered by third-party providers registered on the Platform.' },
  { t: '3. Eligibility', b: 'To use Resqly: You must be at least 18 years old. You must have the legal capacity to enter into a binding agreement. You must provide accurate and complete registration information. You must comply with all applicable laws while using the Platform.' },
  { t: '4. User Accounts', b: 'Users may be required to create an account using mobile number, email, OTP verification, or social login. You are solely responsible for maintaining confidentiality of your login credentials, for all activities under your account, and for preventing unauthorised access. Resqly may suspend or terminate accounts that violate these Terms, engage in fraudulent activities, or use the Platform unlawfully.' },
  { t: '5. Nature of Services', b: 'Resqly provides service discovery, provider matching, emergency support coordination, booking facilitation, communication tools, notifications and tracking features, and hyperlocal assistance services. Features may be introduced, modified, or removed at any time.' },
  { t: '6. Important Disclaimer', b: 'No Medical Advice — Resqly does not provide medical advice, diagnosis, prescription services, clinical recommendations, or emergency healthcare treatment. Information on the Platform is informational only. Consult licensed medical professionals for medical concerns. Emergency Situations — Resqly is not a substitute for official emergency services. In life-threatening situations, immediately contact local ambulance services, hospitals, police, fire departments, or government emergency helplines. Resqly does not guarantee response times, provider availability, location-tracking accuracy, or immediate assistance.' },
  { t: '7. Service Providers', b: 'All service providers on Resqly are independent third parties. Resqly does not employ providers, control their operations, supervise medical practice, or guarantee qualifications beyond submitted verification documents. Verification may include ID, license, phone, and background checks. Users are responsible for independently evaluating providers before engaging services.' },
  { t: '8. Bookings & Requests', b: 'Users may request services, schedule appointments, contact providers, accept quotations and make payments. Resqly does not guarantee acceptance of service requests, provider availability, completion of services, or exact arrival times. Providers may accept, reject, delay, or cancel requests based on their availability.' },
  { t: '9. Payments', b: 'Payments may be processed through third-party gateways. Pricing may vary by distance, service type, demand, availability, time of day, and additional charges. Final pricing may differ from estimates. Refunds depend on cancellation timing, service completion status, provider policies, and investigation outcomes.' },
  { t: '10. Cancellations', b: 'Users may cancel bookings subject to cancellation policies displayed in the Platform. Providers may cancel due to unavailability, safety, incorrect information, operational or technical limitations. Repeated misuse may result in account restrictions.' },
  { t: '11. User Conduct', b: 'Users agree NOT to abuse providers/users, harass individuals, upload illegal content, share false information, violate laws, attempt hacking or reverse engineering, interfere with Platform operations, use the Platform fraudulently, impersonate another person, or post offensive content.' },
  { t: '12. Content & Intellectual Property', b: 'All Platform content (logos, branding, UI, software, graphics, features, text, databases, technology) are owned by or licensed to Resqly. Users may not copy, reproduce, sell, distribute, modify, republish, or reverse engineer any part of the Platform without written permission.' },
  { t: '13. Location Services', b: 'Resqly may require access to GPS, location, device permissions, notifications, camera, microphone. This information is used to connect nearby providers, improve response coordination, enhance service quality, and enable safety features. Users may disable permissions but some features may stop functioning.' },
  { t: '14. Privacy', b: 'By using Resqly, you consent to the collection, storage, and usage of data as described in the Privacy Policy. Resqly implements reasonable security measures but cannot guarantee absolute security.' },
  { t: '15. Third-Party Services', b: 'Resqly may integrate with payment gateways, maps and navigation, SMS/OTP providers, cloud hosting, and analytics tools. Resqly is not responsible for the availability, functionality, or actions of third-party services.' },
  { t: '16. Network & Technical Limitations', b: 'Resqly does not guarantee uninterrupted availability. The Platform may experience downtime, server interruptions, GPS inaccuracies, internet failures, technical bugs, and notification delays.' },
  { t: '17. Limitation of Liability', b: 'To the maximum extent permitted by law, Resqly shall not be liable for indirect damages, loss of profits, personal injury, medical outcomes, service delays, provider misconduct, data loss, unauthorised access, technical interruptions, or emergency response failures. Users use the Platform at their own risk.' },
  { t: '18. Indemnification', b: 'You agree to indemnify Resqly, its founders, employees, affiliates, partners, and agents against claims, damages, liabilities, costs, or legal expenses arising from misuse, violation of Terms, harm caused to providers or users, or unauthorised account activities.' },
  { t: '19. Termination', b: 'Resqly reserves the right to suspend or terminate access without prior notice if Terms are violated, fraudulent activity is detected, the Platform is misused, or legal obligations require action.' },
  { t: '20. Modifications to Terms', b: 'Resqly may update these Terms periodically. Updated Terms become effective upon publication. Continued usage constitutes acceptance.' },
  { t: '21. Governing Law & Disputes', b: 'These Terms shall be governed by the laws of India. Disputes shall fall under the jurisdiction of courts located in Bengaluru, Karnataka, India. Disputes shall first be resolved amicably; if unresolved, they shall be subject to arbitration under the Arbitration and Conciliation Act, 1996. Seat of arbitration: Bengaluru, Karnataka.' },
  { t: '22. Force Majeure', b: 'Resqly shall not be liable for delays or failures caused by events beyond reasonable control including natural disasters, internet outages, government restrictions, pandemic situations, war, strikes, and infrastructure failures.' },
  { t: '23. Severability', b: 'If any provision is found invalid or unenforceable, the remaining provisions shall remain fully valid and enforceable.' },
  { t: '24. Provider Terms', b: 'Providers agree to maintain valid licenses, provide accurate information, deliver services professionally, comply with laws, avoid fraud, and maintain respectful conduct. Resqly may request government ID, professional licenses, address proof, bank details, certifications, vehicle and insurance details. Submission does not guarantee approval. Earnings may be subject to platform fees, taxes, refund deductions, fraud penalties, and compliance verification. Resqly may remove providers, suspend accounts, investigate complaints, modify service availability, and change commission structures at its sole discretion.' },
  { t: '25. Contact Information', b: 'RESQLY PRIVATE LIMITED\nOM CHAMBERS, 648/A, 4TH FLOOR\nBINNAMANGALA, 1ST STAGE\nINDIRANAGAR\nBANGALORE, KARNATAKA - 560038\nEmail: info@resqly.in\nPhone: 8095404400' },
];

export default function Terms() {
  return (
    <MobileShell title="Terms & Conditions">
      <div className="px-5 py-5 text-slate-700">
        <h2 className="text-xl font-bold text-slate-900">Terms & Conditions</h2>
        <p className="text-xs text-slate-500 mt-1">Effective Date: May 25, 2026 • Resqly Private Limited</p>
        <div className="resqly-card p-4 mt-4 bg-blue-50/50 border-blue-100 text-xs">
          By downloading, registering, accessing, or using Resqly, you agree to these Terms.
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
