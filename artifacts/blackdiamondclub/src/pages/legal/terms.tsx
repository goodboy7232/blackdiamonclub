import { Link } from "wouter";
import { FileText, ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 pb-24">
      <Link href="/">
        <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="text-yellow-400 w-7 h-7" />
        <h1 className="text-3xl font-heading font-bold text-white">Terms &amp; Conditions</h1>
      </div>
      <p className="text-white/40 text-sm mb-8">Last updated: January 2025</p>

      <div className="space-y-8 text-white/70 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-bold text-lg mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using BlackDiamondClub ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">2. Eligibility</h2>
          <p>You must be at least 18 years of age to use this platform. By registering, you confirm that you are of legal gambling age in your jurisdiction. We reserve the right to verify age at any time and suspend accounts of underage users.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">3. Account Responsibility</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access. We are not liable for losses arising from unauthorized account access due to your negligence.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">4. Deposits and Withdrawals</h2>
          <p>All deposits are processed in USDT on the BEP20 (BSC) network. The minimum deposit is $10. Withdrawals are subject to identity verification and may take up to 24 hours to process. Funds used in games are non-refundable once played.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">5. Bonuses and Promotions</h2>
          <p>Bonuses are subject to wagering requirements. The welcome bonus of 300% is subject to a 30x wagering requirement before withdrawal. Bonus abuse or multi-accounting will result in account suspension and forfeiture of winnings.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">6. Prohibited Activities</h2>
          <p>Users may not use automated bots, exploits, or cheating software. Money laundering and fraudulent activity are strictly prohibited and will be reported to relevant authorities. We reserve the right to void winnings obtained through prohibited means.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">7. Limitation of Liability</h2>
          <p>BlackDiamondClub is not liable for any losses incurred through gambling on this platform. Gambling involves risk and you should only bet what you can afford to lose. The platform is provided "as is" without warranties of any kind.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">8. Governing Law</h2>
          <p>These Terms are governed by applicable international gaming regulations. Any disputes shall be resolved through binding arbitration.</p>
        </section>
      </div>
    </div>
  );
}
