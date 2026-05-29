import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Trophy, ChevronRight, Play, Rocket, Coins, Star, Shield, Lock, BadgeCheck, Crown, Gem, Flame, CreditCard, Bitcoin, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/shared/TrustBadges";

function useLiveStats() {
  const [players, setPlayers] = useState(3247);
  const [wonToday, setWonToday] = useState(1218400);
  const [gamesPlayed, setGamesPlayed] = useState(98412);
  const [members, setMembers] = useState(52800);

  useEffect(() => {
    const t1 = setInterval(() => setPlayers(p => p + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5 + 1)), 2000);
    const t2 = setInterval(() => setWonToday(w => w + Math.floor(Math.random() * 800 + 100)), 3000);
    const t3 = setInterval(() => setGamesPlayed(g => g + Math.floor(Math.random() * 3 + 1)), 1500);
    const t4 = setInterval(() => setMembers(m => m + 1), 12000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); clearInterval(t4); };
  }, []);

  return { players, wonToday, gamesPlayed, members };
}

function LiveStatsSection() {
  const { players, wonToday, gamesPlayed, members } = useLiveStats();
  const stats = [
    { label: "Players Online", value: players.toLocaleString(), color: "text-green-400", dot: true },
    { label: "Won Today", value: `$${(wonToday / 1000).toFixed(1)}K`, color: "text-yellow-400", dot: false },
    { label: "Games Played", value: gamesPlayed.toLocaleString(), color: "text-cyan-400", dot: false },
    { label: "Total Members", value: `${(members / 1000).toFixed(1)}K+`, color: "text-purple-400", dot: false },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
      <div className="glass rounded-3xl p-6 md:p-8 border border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {stat.dot && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                <motion.p
                  key={stat.value}
                  initial={{ opacity: 0.6, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`text-2xl md:text-3xl font-black font-mono ${stat.color}`}
                >
                  {stat.value}
                </motion.p>
              </div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const featuredGames = [
  { id: "aviator", name: "Aviator Crash", desc: "Ride the multiplier rocket", icon: Rocket, live: true, players: "1,247" },
  { id: "slots777", name: "777 Strike", desc: "Classic high-roller slots", icon: Star, live: false, players: "892" },
  { id: "coinflip", name: "Coin Flip", desc: "50/50 double or nothing", icon: Coins, live: true, players: "3,102" },
  { id: "dicedash", name: "Dice Dash", desc: "Roll your lucky number", icon: Gem, live: false, players: "654" },
  { id: "rocketrush", name: "Rocket Rush", desc: "Launch and win big", icon: Flame, live: true, players: "2,341" },
  { id: "luckywheel", name: "Lucky Wheel", desc: "Spin for massive rewards", icon: Crown, live: false, players: "1,567" },
];

const diamondGirls = [
  { name: "Diamond Lisa", role: "Hostess", img: "/assets/a_glamorous_seductive_casino_e10e.png" },
  { name: "Ruby Queen", role: "VIP Dealer", img: "/assets/an_elegant_glamorous_woman_d988.png" },
  { name: "Sapphire Star", role: "Event Host", img: "/assets/a_beautiful_glamorous_woman_9629.png" },
  { name: "Emerald Vixen", role: "High Roller", img: "/assets/an_attractive_elegant_woman_28fe.png" },
  { name: "Gold Angel", role: "VIP Manager", img: "/assets/a_glamorous_confident_woman_6101.png" },
  { name: "Crystal Belle", role: "Hostess", img: "/assets/a_glamorous_seductive_casino_e10e.png" },
];

const vipLevels = [
  { name: "Bronze", bonus: "5%", color: "from-amber-700 to-amber-600" },
  { name: "Silver", bonus: "10%", color: "from-slate-400 to-slate-300" },
  { name: "Gold", bonus: "15%", color: "from-yellow-500 to-yellow-400" },
  { name: "Diamond", bonus: "20%", color: "from-cyan-400 to-blue-400" },
];

const EURO_NAMES = [
  "James", "Oliver", "William", "Lucas", "Mason", "Ethan", "Liam", "Noah",
  "Emma", "Olivia", "Sophia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia",
  "Alexander", "Benjamin", "Henry", "Sebastian", "Leo", "Jack", "Daniel", "Samuel",
  "Elena", "Victoria", "Chloe", "Grace", "Lily", "Zoe", "Harper", "Nora",
  "Max", "Felix", "Oscar", "Theo", "Finn", "Arthur", "Louis", "Julian",
  "Stella", "Mila", "Alice", "Clara", "Ella", "Ivy", "Nova", "Ruby",
];

const GAME_ACTIONS = [
  { verb: "hit", object: "x multiplier on", games: ["Aviator", "Rocket Rush", "Crash", "Slots"] },
  { verb: "cashed out at", object: "x on", games: ["Aviator", "Rocket Rush", "Crash", "Tower Climb"] },
  { verb: "won", object: "\u20ac", amount: true, games: ["Lucky Wheel", "777 Strike", "Slots", "Gem Drop"] },
  { verb: "struck GOLD on", object: "", games: ["777 Strike", "Slots", "Gem Drop", "Lucky Wheel"] },
  { verb: "just won", object: "\u20ac", amount: true, games: ["Aviator", "Rocket Rush", "Crash", "Tower Climb"] },
];

function useLiveWinners(count: number) {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    const gen = () => {
      const name = EURO_NAMES[Math.floor(Math.random() * EURO_NAMES.length)];
      const action = GAME_ACTIONS[Math.floor(Math.random() * GAME_ACTIONS.length)];
      const game = action.games[Math.floor(Math.random() * action.games.length)];
      let msg = "";
      if (action.amount) {
        const amt = Math.floor(Math.random() * 450 + 5) * 1000;
        msg = `${name} ${action.verb} ${action.object}${amt.toLocaleString()} on ${game}`;
      } else if (action.verb === "hit") {
        const mult = (Math.random() * 48 + 2).toFixed(1);
        msg = `${name} ${action.verb} a ${mult}${action.object}${game}`;
      } else if (action.verb === "cashed out at") {
        const mult = (Math.random() * 15 + 1.5).toFixed(1);
        msg = `${name} ${action.verb} ${mult}${action.object}${game}`;
      } else {
        msg = `${name} ${action.verb}${action.object} ${game}`;
      }
      return msg;
    };
    const initial = Array.from({ length: count }, gen);
    setItems(initial);
    const interval = setInterval(() => {
      setItems(prev => {
        const next = [...prev];
        next.shift();
        next.push(gen());
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [count]);
  return items;
}

function MarqueeTicker() {
  const winners = useLiveWinners(12);
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-900/80 via-yellow-900/60 to-red-900/80 border-y border-yellow-500/20 py-2">
      <div className="animate-marquee flex whitespace-nowrap gap-8">
        {[...winners, ...winners, ...winners].map((w, i) => (
          <span key={i} className="text-sm font-bold text-yellow-300 flex items-center gap-2">
            <Flame size={14} className="text-red-400" /> {w}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-0 pb-8">
      {/* Hero Banner */}
      <section className="relative w-full min-h-[85vh] overflow-hidden flex items-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a0a] to-[#0a0a0a]" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-yellow-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-gradient-to-tr from-red-900/10 to-transparent" />
        
        {/* Hero Image - right side */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
          <img
            src="/assets/a_glamorous_seductive_casino_e10e.png"
            alt="Casino Glamour"
            className="h-full w-full object-cover object-top opacity-80"
            style={{ maskImage: "linear-gradient(to left, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to left, black 60%, transparent 100%)" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full flex flex-col justify-center min-h-[85vh] pt-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm font-bold uppercase tracking-wider backdrop-blur-md">
                <Crown size={16} /> Exclusive VIP Access
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4 leading-tight break-words">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 text-glow drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                  BlackDiamondClub
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/70 mb-2 font-light">
                Where Luxury Meets Fortune
              </p>
              <p className="text-lg text-yellow-500/80 mb-8 font-bold tracking-wide">
                HIGH ROLLERS ONLY
              </p>
              
              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/games">
                  <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black hover:from-yellow-400 hover:to-yellow-300 text-lg px-10 py-6 h-auto rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(234,179,8,0.6)]">
                    <Play className="w-5 h-5 mr-2" /> PLAY NOW
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-lg px-8 py-6 h-auto rounded-full font-bold tracking-wider transition-all hover:scale-105">
                    Join Now &amp; Get 300% Bonus
                  </Button>
                </Link>
              </div>
              
              {/* Trust badges */}
              <TrustBadges />
            </motion.div>
          </div>
        </div>
        
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
      </section>

      {/* Live Winners Ticker */}
      <MarqueeTicker />

      {/* Game Logos */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-8 pb-2">
        <div className="flex items-center justify-center gap-3 md:gap-5 overflow-x-auto pb-2 no-scrollbar snap-x">
          {featuredGames.map((game, i) => {
            const Icon = game.icon;
            return (
              <Link key={game.id} href={`/game/${game.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex-shrink-0 snap-center flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-primary/40 group-hover:from-primary/20 group-hover:to-primary/5 flex items-center justify-center transition-all duration-300 shadow-lg group-hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                    <Icon size={28} strokeWidth={1.5} className="text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-white/60 group-hover:text-primary transition-colors whitespace-nowrap">{game.name.split(" ")[0]}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Games */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-heading font-bold text-white flex items-center">
            <Trophy className="text-primary mr-2 md:mr-3 w-5 h-5 md:w-6 md:h-6" /> Featured Games
          </h2>
          <Link href="/games">
            <Button variant="link" className="text-primary hover:text-white text-sm md:text-base" data-testid="view-all-games">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {featuredGames.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link href={`/game/${game.id}`}>
                  <div className="glass group hover:glass-gold rounded-xl md:rounded-2xl p-3 md:p-4 transition-all duration-300 cursor-pointer text-center relative overflow-hidden h-full flex flex-col justify-between" data-testid={`featured-${game.id}`}>
                    {game.live && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                      </div>
                    )}
                    <div className="flex justify-center mb-2 md:mb-3 text-primary group-hover:scale-110 transition-transform duration-500 mt-2 md:mt-4">
                      <Icon size={32} strokeWidth={1.5} className="md:w-10 md:h-10" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-bold text-white mb-1">{game.name}</h3>
                      <p className="text-white/40 text-[10px] md:text-xs mb-2 hidden sm:block">{game.desc}</p>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-white/30">
                      <Play size={10} /> {game.players} playing
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Diamond Girls Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-bold text-white mb-2">
            <Gem className="inline text-primary mr-2 w-7 h-7" /> Meet Our Diamond Girls
          </h2>
          <p className="text-white/40 text-sm">The queens of BlackDiamond Club</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {diamondGirls.map((girl, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-primary/30 transition-all duration-300"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={girl.img}
                  alt={girl.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  style={{ filter: "brightness(0.85)" }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8">
                <h3 className="text-sm font-bold text-white">{girl.name}</h3>
                <p className="text-[10px] text-primary font-medium">{girl.role}</p>
              </div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* VIP & Promotions */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Welcome Bonus */}
          <div className="glass-gold rounded-3xl p-8 relative overflow-hidden border border-yellow-500/20">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-500/20 blur-[80px] rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="text-yellow-400 w-8 h-8" />
                <h3 className="text-2xl font-heading font-bold text-white">Welcome Bonus</h3>
              </div>
              <p className="text-5xl font-black text-yellow-400 mb-2">300%</p>
              <p className="text-white/60 mb-4">First deposit match + 50 Free Spins</p>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold hover:from-yellow-400 hover:to-yellow-300">
                  Claim Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Weekly Cashback */}
          <div className="glass rounded-3xl p-8 relative overflow-hidden border border-white/10">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <WalletIcon className="text-purple-400 w-8 h-8" />
                <h3 className="text-2xl font-heading font-bold text-white">Weekly Cashback</h3>
              </div>
              <p className="text-5xl font-black text-purple-400 mb-2">20%</p>
              <p className="text-white/60 mb-4">Get up to 20% back every Monday</p>
              <Link href="/profile">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                  View Status
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* VIP Levels */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6 text-center">VIP Levels</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {vipLevels.map((vip, i) => (
              <div key={i} className={`relative px-6 py-4 rounded-2xl bg-gradient-to-br ${vip.color} text-white text-center border border-white/10 shadow-lg`}>
                <div className="text-xs font-bold opacity-70 uppercase tracking-wider">{vip.name}</div>
                <div className="text-2xl font-black">{vip.bonus}</div>
                <div className="text-[10px] opacity-70">Cashback</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Platform Stats */}
      <LiveStatsSection />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0a0a] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/assets/logo.png" alt="BDC" className="w-8 h-8 rounded-lg" />
                <span className="font-bold text-white">BlackDiamond</span>
              </div>
              <p className="text-xs text-white/40 mb-4">Where Fortune Meets Luxury. India&apos;s #1 luxury gambling platform.</p>
              <div className="flex gap-2">
                <div className="px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-bold">18+</div>
                <div className="px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400 font-bold">SSL</div>
                <div className="px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-bold">LICENSED</div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Games</h4>
              <div className="space-y-2 text-xs text-white/40">
                <Link href="/game/aviator"><div className="hover:text-primary cursor-pointer transition-colors">Aviator</div></Link>
                <Link href="/game/slots777"><div className="hover:text-primary cursor-pointer transition-colors">Slots</div></Link>
                <Link href="/game/coinflip"><div className="hover:text-primary cursor-pointer transition-colors">Coin Flip</div></Link>
                <Link href="/games"><div className="hover:text-primary cursor-pointer transition-colors">All Games</div></Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Legal</h4>
              <div className="space-y-2 text-xs text-white/40">
                <Link href="/legal/responsible-gambling"><div className="hover:text-primary cursor-pointer transition-colors">Responsible Gambling</div></Link>
                <Link href="/legal/terms"><div className="hover:text-primary cursor-pointer transition-colors">Terms &amp; Conditions</div></Link>
                <Link href="/legal/privacy"><div className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</div></Link>
                <Link href="/legal/aml"><div className="hover:text-primary cursor-pointer transition-colors">AML Policy</div></Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Payments</h4>
              <div className="flex flex-wrap gap-2">
                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 flex items-center gap-1">
                  <CreditCard size={10} /> UPI
                </div>
                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 flex items-center gap-1">
                  <Bitcoin size={10} /> BTC
                </div>
                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 flex items-center gap-1">
                  <WalletIcon size={10} /> USDT
                </div>
                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/60">NetBanking</div>
                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/60">Paytm</div>
                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/60">PhonePe</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-6">
            <div className="flex flex-wrap gap-4 justify-center mb-4">
              {["SSL Secured", "Provably Fair", "18+ Only", "Licensed & Regulated", "Responsible Gambling"].map((tag) => (
                <span key={tag} className="text-[10px] text-white/20 border border-white/10 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <p className="text-[10px] text-white/30 mb-2 text-center">
              Please gamble responsibly. Gambling should be fun, not a source of income. If you feel you may have a problem, please contact our support team.
            </p>
            <p className="text-[10px] text-white/20 text-center">
              &copy; 2025 BlackDiamondClub. All Rights Reserved. 18+ only. Licensed &amp; Regulated.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
