import { Link } from "wouter";
import { Scale, ArrowLeft } from "lucide-react";

export default function AML() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 pb-24">
      <Link href="/">
        <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <Scale className="text-blue-400 w-7 h-7" />
        <h1 className="text-3xl font-heading font-bold text-white">AML Policy</h1>
      </div>
      <p className="text-white/40 text-sm mb-8">Anti-Money Laundering &amp; Know Your Customer Policy — Last updated: January 2025</p>

      <div className="space-y-8 text-white/70 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-bold text-lg mb-3">1. Our Commitment</h2>
          <p>BlackDiamondClub is committed to preventing money laundering, terrorist financing, and other financial crimes. We comply with all applicable AML/CFT regulations and implement robust controls to detect and report suspicious activity.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">2. Know Your Customer (KYC)</h2>
          <p>We may require identity verification for large transactions or when suspicious activity is detected. You may be asked to provide government-issued ID, proof of address, and source of funds documentation. Failure to comply may result in account suspension.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">3. Transaction Monitoring</h2>
          <p>All transactions are monitored for unusual patterns. Flags include: large or frequent deposits without corresponding gameplay, rapid deposit and withdrawal without gambling, and transactions from high-risk jurisdictions. Suspicious transactions are reviewed by our compliance team.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">4. Reporting Obligations</h2>
          <p>We are obligated to report suspicious transactions to relevant financial intelligence units. We cooperate fully with law enforcement investigations. Account freezes may be applied during investigations without prior notice.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">5. Prohibited Users</h2>
          <p>We do not accept users from FATF blacklisted jurisdictions or those on international sanctions lists. Politically Exposed Persons (PEPs) are subject to enhanced due diligence. Our systems screen against global watchlists.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">6. Employee Training</h2>
          <p>Our compliance team receives regular AML/CFT training. A designated Money Laundering Reporting Officer (MLRO) oversees our compliance program. We conduct annual risk assessments and audits.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">7. Contact</h2>
          <p>For AML-related inquiries or to report suspicious activity, contact our compliance team through the support channel. All reports are treated with strict confidentiality.</p>
        </section>
      </div>
    </div>
  );
}
