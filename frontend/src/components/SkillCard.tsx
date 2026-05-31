import { GlassCard } from "./GlassCard";
import { AvailabilityDot } from "./AvailabilityDot";
import { TrustBadge } from "./TrustBadge";
import {
  Star, Sparkles, Loader2, X, Coins, Check, Upload,
  Video, ArrowLeftRight, CreditCard, Play, AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState, useRef } from "react";
import { useApp } from "@/lib/store";
import { skills as skillsApi, swaps as swapsApi, auth as authApi, uploads as uploadsApi } from "@/services/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type SwapMode = "barter" | "video" | "direct";

export function SkillCard({ skill }: { skill: any }) {
  const user    = useApp((s) => s.user);
  const setUser = useApp((s) => s.setUser);
  const bumpSwapRefresh = useApp((s) => s.bumpSwapRefresh);
  const navigate = useNavigate();

  // Modal state
  const [showModal, setShowModal]             = useState(false);
  const [mode, setMode]                       = useState<SwapMode>("barter");

  // Barter state
  const [loadingSkills, setLoadingSkills]     = useState(false);
  const [myTeachSkills, setMyTeachSkills]     = useState<any[]>([]);
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState("");

  // Video state
  const [videoFile, setVideoFile]             = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading]             = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress]  = useState(0);
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  // Common state
  const [message, setMessage]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mentor = {
    id:     String(skill.user_id || skill.mentorId || ""),
    name:   skill.user_name || skill.mentorName || "Mentor",
    avatar: skill.avatar_url || skill.mentorAvatar || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(skill.user_name || "Mentor")}&backgroundColor=3b82f6,8b5cf6,06b6d4`,
    location: skill.location || "Online",
    trust:  parseFloat(skill.trust_score) || 50,
    online: true,
  };

  if (!mentor.id) return null;

  const title    = skill.skill_name || skill.title;
  const category = skill.category;
  const level    = skill.proficiency || skill.level;
  const tags     = skill.tags || ["session", skill.session_format || "online"];
  const rating   = skill.rating || 4.8;
  const reviews  = skill.reviews || 16;
  const rate     = skill.credit_rate || skill.rate;
  const trending = !!skill.trending;

  const creditCost = mode === "direct" ? (rate || 5) : 0;

  const handleOpenModal = async () => {
    if (!user) { toast.error("Please sign in to request a skill swap"); navigate({ to: "/login" }); return; }
    if (String(user.id) === String(mentor.id)) { toast.error("You cannot swap skills with yourself!"); return; }
    setShowModal(true);
    setMode("barter");
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setUploadedVideoUrl(null);
    setUploadProgress(0);
    setMessage("");
    setLoadingSkills(true);
    try {
      const data = await skillsApi.getUserSkills();
      const teachOnly = (data || []).filter((s: any) => s.type === "teach");
      setMyTeachSkills(teachOnly);
      if (teachOnly.length > 0) setSelectedOfferedSkill(String(teachOnly[0].skill_id));
    } catch {
      toast.error("Failed to load your teaching skills");
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("Video must be under 50 MB"); return; }
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"];
    if (!allowed.includes(file.type)) { toast.error("Please upload an MP4, WebM, MOV, or AVI video"); return; }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setUploadedVideoUrl(null);
    setUploadProgress(0);
  };

  const handleUploadVideo = async () => {
    if (!videoFile) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      // Simulate progress ticks
      const ticker = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 85)), 400);
      const result = await uploadsApi.video(videoFile);
      clearInterval(ticker);
      setUploadProgress(100);
      setUploadedVideoUrl(result.url);
      toast.success("Video uploaded successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Video upload failed");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (mode === "barter" && !selectedOfferedSkill) {
      toast.error("Please select a skill to teach in exchange"); return;
    }
    if (mode === "video" && !uploadedVideoUrl) {
      toast.error("Please upload your pitch video first"); return;
    }
    if (mode === "direct" && user && user.credits < creditCost) {
      toast.error(`Insufficient credits. You have ${user.credits}, need ${creditCost}.`); return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        receiver_id:        parseInt(mentor.id),
        skill_requested_id: parseInt(skill.skill_id || skill.id),
        message: message.trim() || `Hi ${mentor.name}, I'd love to learn ${title}!`,
      };
      if (mode === "barter")  payload.skill_offered_id = parseInt(selectedOfferedSkill);
      if (mode === "video")   payload.video_url        = uploadedVideoUrl;

      await swapsApi.create(payload);

      const modeLabel = mode === "barter" ? "Barter swap" : mode === "video" ? "Video pitch swap" : "Direct swap";
      toast.success(`${modeLabel} request sent!${mode === "direct" ? ` ${creditCost} credits locked in escrow.` : " Free of charge!"}`);

      // Refresh user credits
      const updatedUser = await authApi.me();
      if (updatedUser) setUser({ ...user!, credits: parseInt(updatedUser.credits) || 0 });

      // Signal dashboard / other listeners to re-fetch swap data
      bumpSwapRefresh();

      setShowModal(false);
      setMessage("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send swap request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setShowModal(false);
  };

  const modeTab = (id: SwapMode, icon: React.ReactNode, label: string, badge?: string) => (
    <button
      key={id}
      onClick={() => setMode(id)}
      className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-xs font-medium transition-all cursor-pointer ${
        mode === id
          ? "border-primary/60 bg-gradient-to-b from-primary/20 to-accent/10 text-foreground shadow-lg shadow-primary/10"
          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
          badge === "FREE" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
        }`}>{badge}</span>
      )}
    </button>
  );

  return (
    <>
      <GlassCard
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="group flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={mentor.avatar} alt="" className="size-10 rounded-full ring-1 ring-white/10" />
              <span className="absolute -bottom-0.5 -right-0.5"><AvailabilityDot online={mentor.online} /></span>
            </div>
            <div>
              <Link to="/profile/$userId" params={{ userId: mentor.id }} className="text-sm font-semibold hover:underline">
                {mentor.name}
              </Link>
              <div className="text-xs text-muted-foreground">{mentor.location}</div>
            </div>
          </div>
          {trending && (
            <Badge className="gap-1 border-0 bg-gradient-to-r from-primary/30 to-accent/30 text-foreground">
              <Sparkles className="size-3" /> Trending
            </Badge>
          )}
        </div>
        <div>
          <h3 className="font-display text-base font-semibold leading-snug">{title}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{category}</span>·<span>{level}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t: string) => (
            <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-amber-300"><Star className="size-3.5 fill-current" /> {rating}</span>
            <span className="text-muted-foreground">({reviews})</span>
            <TrustBadge score={mentor.trust} />
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">credits / hr</div>
            <div className="font-display text-lg font-semibold text-gradient">{rate}</div>
          </div>
        </div>
        <Button onClick={handleOpenModal} variant="secondary" className="w-full bg-white/5 hover:bg-white/10 cursor-pointer">
          Request swap
        </Button>
      </GlassCard>

      {/* ─── Swap Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0e0f1a]/95 p-6 backdrop-blur-2xl shadow-2xl shadow-black/50"
            >
              {/* Glow blobs */}
              <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-primary/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 size-52 rounded-full bg-accent/20 blur-3xl" />

              <button
                onClick={handleClose}
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>

              <div className="relative flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground shadow-lg">
                  S
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">Skill Swap Request</h3>
                  <p className="text-xs text-muted-foreground">Choose how you'd like to propose the exchange</p>
                </div>
              </div>

              {/* Skill being requested */}
              <div className="relative mt-5 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Requesting from {mentor.name}</div>
                <div className="mt-1 font-semibold text-base">{title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{category} · {level}</span>
                  <span className="inline-flex items-center gap-1"><Coins className="size-3 text-primary" /> {rate} cr/hr listed</span>
                </div>
              </div>

              {/* Mode selector */}
              <div className="relative mt-4 flex gap-2">
                {modeTab("barter",  <ArrowLeftRight className="size-4" />, "Skill Barter", "FREE")}
                {modeTab("video",   <Video className="size-4" />,          "Video Pitch",  "FREE")}
                {modeTab("direct",  <CreditCard className="size-4" />,     "Direct Book",  `${rate} CR`)}
              </div>

              {/* Mode content */}
              <div className="relative mt-4 space-y-4">
                <AnimatePresence mode="wait">
                  {/* ── Barter ── */}
                  {mode === "barter" && (
                    <motion.div key="barter" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-3">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
                        <Check className="size-3.5 shrink-0" /> Offer a skill you teach — no credits charged!
                      </div>
                      {loadingSkills ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                          <Loader2 className="size-4 animate-spin text-primary" /> Loading your teaching skills...
                        </div>
                      ) : myTeachSkills.length > 0 ? (
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1.5">
                            Skill you'll teach in exchange
                          </label>
                          <select
                            value={selectedOfferedSkill}
                            onChange={(e) => setSelectedOfferedSkill(e.target.value)}
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none text-foreground focus:border-primary/50"
                          >
                            {myTeachSkills.map((s) => (
                              <option key={s.id} value={s.skill_id} className="bg-[#0e0f1a]">
                                {s.skill_name} ({s.proficiency})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex items-start gap-2">
                          <AlertCircle className="size-4 mt-0.5 shrink-0" />
                          <span>You haven't listed any teaching skills. <a href="/profile" className="underline">Add skills to your profile</a> to barter, or switch to Video Pitch or Direct Booking.</span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Video Pitch ── */}
                  {mode === "video" && (
                    <motion.div key="video" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-3">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
                        <Video className="size-3.5 shrink-0" /> Upload a short pitch video — no credits charged!
                      </div>
                      {!videoFile ? (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                            <Upload className="size-6" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">Drop your pitch video here</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">MP4, WebM, MOV · up to 50 MB</div>
                          </div>
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {/* Video preview */}
                          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                            <video
                              src={videoPreviewUrl!}
                              controls
                              className="max-h-40 w-full object-contain"
                            />
                            <button
                              onClick={() => { setVideoFile(null); setVideoPreviewUrl(null); setUploadedVideoUrl(null); setUploadProgress(0); }}
                              className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg bg-black/60 text-white hover:bg-black/80"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Play className="size-3.5 text-primary" />
                            <span className="truncate">{videoFile.name}</span>
                            <span className="shrink-0">({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                          </div>
                          {/* Upload progress */}
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Uploading…</span><span>{uploadProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          )}
                          {uploadedVideoUrl ? (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-xs text-emerald-300">
                              <Check className="size-3.5 shrink-0" /> Video uploaded successfully!
                            </div>
                          ) : (
                            <Button onClick={handleUploadVideo} disabled={uploading} size="sm" className="w-full bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground">
                              {uploading ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Uploading…</> : <><Upload className="size-3.5 mr-1.5" />Upload Video</>}
                            </Button>
                          )}
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" className="sr-only" onChange={handleVideoSelect} />
                    </motion.div>
                  )}

                  {/* ── Direct Booking ── */}
                  {mode === "direct" && (
                    <motion.div key="direct" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-3">
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-200 flex items-center gap-2">
                        <Coins className="size-3.5 shrink-0 text-amber-300" /> Credits will be locked in escrow until session completes.
                      </div>
                      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs">
                        <div>
                          <div className="text-muted-foreground">Your Balance</div>
                          <div className={`mt-0.5 text-lg font-bold ${user && user.credits < creditCost ? "text-red-400" : "text-foreground"}`}>
                            {user?.credits ?? 0} <span className="text-xs font-normal text-muted-foreground">cr</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">Amount to Lock</div>
                          <div className="mt-0.5 text-lg font-bold text-gradient">{creditCost} <span className="text-xs font-normal text-muted-foreground">cr</span></div>
                        </div>
                      </div>
                      {user && user.credits < creditCost && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300 flex items-start gap-2">
                          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                          <span>Not enough credits. Switch to <strong>Skill Barter</strong> or <strong>Video Pitch</strong> (free!), or buy credits from your wallet.</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1.5">
                    Message to {mentor.name}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hi ${mentor.name}, I'd love to learn ${title}…`}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none placeholder:text-muted-foreground text-foreground focus:border-primary/50"
                  />
                </div>

                {/* Cost summary */}
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-xs">
                  <span className="text-muted-foreground">Credits charged:</span>
                  <span className={`font-bold ${creditCost === 0 ? "text-emerald-300" : "text-gradient"}`}>
                    {creditCost === 0 ? "0 — Free!" : `${creditCost} credits`}
                  </span>
                </div>
              </div>

              <div className="relative mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={handleClose} className="bg-white/5 hover:bg-white/10">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSwap}
                  disabled={
                    submitting ||
                    (mode === "barter" && myTeachSkills.length === 0) ||
                    (mode === "video" && !uploadedVideoUrl) ||
                    (mode === "direct" && !!user && user.credits < creditCost)
                  }
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {submitting ? "Sending…" : "Confirm Swap Request"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
