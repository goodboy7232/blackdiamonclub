import { Link } from "wouter";
import { HeartHandshake, ArrowLeft, Phone, AlertTriangle, CheckCircle } from "lucide-react";

const warningSignsList = [
  "Spending more than you can afford to lose",
  "Chasing losses by making larger bets",
  "Neglecting work, family, or social obligations",
  "Borrowing money to gamble",
  "Feeling anxious or irritable when not gambling",
  "Lying to others about your gambling habits",
  "Using gambling as an escape from stress or problems",
];

const tipsList = [
  "Set a budget before you play and stick to it",
  "Use deposit limits to control your spending",
  "Take regular breaks — set time limits",
  "Never gamble while under the influence",
  "Don't chase losses — accept them and walk away",
  "Balance gambling with other leisure activities",
  "Keep track of how much you spend and win",
];

export default function ResponsibleGambling() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 pb-24">
      <Link href="/">
        <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <HeartHandshake className="text-purple-400 w-7 h-7" />
        <h1 className="text-3xl font-heading font-bold text-white">Responsible Gambling</h1>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 mb-8">
        <p className="text-white/80 text-sm leading-relaxed">
          At BlackDiamondClub, we are committed to promoting responsible gambling. Gambling should be a fun and entertaining activity — not a way to make money or escape problems. We provide tools and resources to help you gamble responsibly.
        </p>
      </div>

      <div className="space-y-8 text-white/70 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-400" /> Warning Signs of Problem Gambling
          </h2>
          <ul className="space-y-2">
            {warningSignsList.map((sign, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {sign}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" /> Tips for Safe Gambling
          </h2>
          <ul className="space-y-2">
            {tipsList.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-3">Self-Exclusion</h2>
          <p>If you feel your gambling is getting out of control, you can request a self-exclusion period (30 days, 90 days, 6 months, or permanent). Contact our support team to activate this. During exclusion, you will not be able to access your account or make deposits.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Phone size={18} className="text-blue-400" /> Help Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "Gamblers Anonymous", url: "www.gamblersanonymous.org" },
              { name: "BeGambleAware", url: "www.begambleaware.org" },
              { name: "GamCare", url: "www.gamcare.org.uk" },
              { name: "National Problem Gambling Helpline", url: "1-800-522-4700" },
            ].map((r) => (
              <div key={r.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="font-bold text-white text-sm">{r.name}</p>
                <p className="text-xs text-blue-400 mt-1">{r.url}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-white/10 pt-6">
          <p className="text-white/30 text-xs">18+ only. Gambling can be addictive — please play responsibly.</p>
        </div>
      </div>
    </div>
  );
}
