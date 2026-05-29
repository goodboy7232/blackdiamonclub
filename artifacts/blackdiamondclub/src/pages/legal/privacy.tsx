import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 pb-24">
      <Link href="/">
        <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-cyan-400 w-7 h-7" />
        <h1 className="text-3xl font-heading font-bold text-white">Privacy Policy</h1>
      </div>
      <p className="text-white/40 text-sm mb-8">Last updated: January 2025</p>

      <div className="space-y-8 text-white/70 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-bold text-lg mb-3">1. Information We Collect</h2>
          <p>We collect information you provide during registration (username, password), financial transactions (deposit amounts, wallet addresses), and usage data (game history, session logs). We do not collect personally identifiable information beyond what is necessary for operation.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">2. How We Use Your Information</h2>
          <p>Your data is used to operate the platform, process transactions, prevent fraud, comply with legal obligations, and improve our services. We do not sell your personal data to third parties.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">3. Data Security</h2>
          <p>We use industry-standard SSL encryption to protect data in transit. Passwords are hashed and salted. Wallet addresses are stored securely and never shared. We conduct regular security audits.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">4. Cookies</h2>
          <p>We use session cookies for authentication and local storage for preferences. We do not use third-party advertising cookies. You may disable cookies in your browser, but this may affect platform functionality.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">5. Data Retention</h2>
          <p>Transaction records are retained for 7 years for compliance purposes. Account data is retained while your account is active and for 2 years thereafter. You may request account deletion by contacting support.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">6. Third-Party Services</h2>
          <p>We use blockchain networks for payment processing. These third-party services have their own privacy policies. Game fairness is verified through cryptographic proofs on-chain.</p>
        </section>
        <section>
          <h2 className="text-white font-bold text-lg mb-3">7. Your Rights</h2>
          <p>You have the right to access, correct, or delete your data. To exercise these rights, contact our support team. We will respond within 30 days.</p>
        </section>
      </div>
    </div>
  );
}
