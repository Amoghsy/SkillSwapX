import { GlassCard } from "./GlassCard";
import {
  Coins, ArrowUpRight, Flame, X, Check, Loader2,
  ShoppingCart, Zap, Star, Crown, Sparkles, CreditCard, Lock,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { credits as creditsApi } from "@/services/api";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

type Pack = {
  id: string;
  label: string;
  credits: number;
  price: number;
  bonus?: string;
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
};

const PACKS: Pack[] = [
  {
    id: "bronze",
    label: "Bronze Pack",
    credits: 5,
    price: 5,
    icon: <Zap className="size-5" />,
    color: "from-amber-700/30 to-orange-600/20",
  },
  {
    id: "silver",
    label: "Silver Pack",
    credits: 10,
    price: 9,
    bonus: "Save $1",
    icon: <Star className="size-5" />,
    color: "from-slate-400/20 to-blue-400/10",
    popular: true,
  },
  {
    id: "gold",
    label: "Gold Pack",
    credits: 20,
    price: 16,
    bonus: "Save $4",
    icon: <Crown className="size-5" />,
    color: "from-yellow-500/20 to-amber-400/10",
  },
  {
    id: "elite",
    label: "Elite Pack",
    credits: 50,
    price: 35,
    bonus: "Save $15",
    icon: <Sparkles className="size-5" />,
    color: "from-primary/20 to-accent/10",
  },
];

function CardInput({ label, placeholder, type = "text", maxLength, className = "" }: {
  label: string; placeholder: string; type?: string; maxLength?: number; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
      />
    </div>
  );
}

export function CreditWallet() {
  const credits  = useApp((s) => s.credits);
  const setCredits = useApp((s) => s.setCredits);
  const streak   = useApp((s) => s.user?.streak ?? 0);

  const [showShop, setShowShop]       = useState(false);
  const [selected, setSelected]       = useState<Pack>(PACKS[1]);
  const [buying, setBuying]           = useState(false);
  const [bought, setBought]           = useState(false);

  const handleBuy = async () => {
    setBuying(true);
    try {
      const result = await creditsApi.buy(selected.credits);
      setCredits(result.new_balance);
      setBought(true);
      toast.success(`🎉 ${selected.credits} credits added to your wallet!`);
      setTimeout(() => {
        setBought(false);
        setShowShop(false);
      }, 2000);
    } catch (err: any) {
      toast.error(err?.message || "Purchase failed. Please try again.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      <GlassCard variant="strong" glow="primary" className="relative overflow-hidden">
        <div className="absolute -right-10 -top-10 size-44 rounded-full bg-primary/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -left-8 size-44 rounded-full bg-accent/30 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Coins className="size-3.5" /> Skill credits
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-200">
              <Flame className="size-3" /> {streak}-day streak
            </span>
          </div>
          <div className="mt-3 font-display text-5xl font-semibold text-gradient">{credits}</div>
          <div className="mt-1 text-xs text-muted-foreground">available balance · earn by teaching</div>
          <div className="mt-4 flex gap-2">
            <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15 cursor-pointer transition-colors">
              Earn more <ArrowUpRight className="size-4" />
            </button>
            <button
              onClick={() => { setShowShop(true); setBought(false); }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2 text-sm font-medium text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="size-4" /> Buy Credits
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ─── Credit Shop Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d18]/97 shadow-2xl shadow-black/60"
            >
              {/* Ambient glows */}
              <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-accent/15 blur-3xl" />

              {/* Header */}
              <div className="relative flex items-center justify-between border-b border-white/5 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20">
                    <Coins className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold">Credit Shop</h3>
                    <p className="text-xs text-muted-foreground">Purchase skill credits instantly</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShop(false)}
                  className="grid size-8 place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="relative p-6 space-y-5">
                {/* Pack selector */}
                <div>
                  <div className="mb-2.5 text-xs uppercase tracking-widest text-muted-foreground font-medium">Choose a pack</div>
                  <div className="grid grid-cols-2 gap-2">
                    {PACKS.map((pack) => (
                      <button
                        key={pack.id}
                        onClick={() => setSelected(pack)}
                        className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                          selected.id === pack.id
                            ? "border-primary/60 bg-gradient-to-br shadow-lg shadow-primary/10 " + pack.color
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                        }`}
                      >
                        {pack.popular && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                            Popular
                          </span>
                        )}
                        <div className={`${selected.id === pack.id ? "text-primary" : "text-muted-foreground"} transition-colors`}>
                          {pack.icon}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">{pack.label}</div>
                          <div className="mt-0.5 font-display text-xl font-bold text-gradient">{pack.credits} <span className="text-xs font-normal text-muted-foreground">cr</span></div>
                        </div>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm font-semibold">${pack.price}</span>
                          {pack.bonus && (
                            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300">{pack.bonus}</span>
                          )}
                        </div>
                        {selected.id === pack.id && (
                          <motion.div layoutId="pack-check" className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order summary */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-2">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Order Summary</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{selected.label}</span>
                    <span>{selected.credits} credits</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span>${selected.price}.00</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-gradient">${selected.price}.00</span>
                  </div>
                </div>

                {/* Payment form */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    <span className="uppercase tracking-widest font-medium">Payment Details</span>
                    <div className="ml-auto flex items-center gap-1 text-emerald-400">
                      <Lock className="size-3" /> <span className="text-[10px]">Secure</span>
                    </div>
                  </div>
                  <CardInput label="Cardholder Name" placeholder="Jane Smith" />
                  <CardInput label="Card Number" placeholder="1234 5678 9012 3456" maxLength={19} />
                  <div className="grid grid-cols-2 gap-3">
                    <CardInput label="Expiry" placeholder="MM / YY" maxLength={7} />
                    <CardInput label="CVV" placeholder="•••" type="password" maxLength={4} />
                  </div>
                </div>

                {/* Buy button */}
                <Button
                  onClick={handleBuy}
                  disabled={buying || bought}
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                >
                  {bought ? (
                    <span className="flex items-center gap-2">
                      <Check className="size-4" /> Payment Successful!
                    </span>
                  ) : buying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Processing…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="size-4" /> Pay ${selected.price} · Get {selected.credits} Credits
                    </span>
                  )}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground">
                  Credits are added instantly. No subscriptions. 100% satisfaction guaranteed.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
