import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, Save, ShieldCheck, Sparkles, X } from "lucide-react";
import { clearOpenRouterConfig, getOpenRouterConfig, saveOpenRouterConfig } from "./openRouter";

export default function OpenRouterSettings({ onClose }: { onClose: () => void }) {
  const saved = getOpenRouterConfig();
  const [apiKey, setApiKey] = useState(saved?.apiKey || "");
  const [model, setModel] = useState(saved?.model || "openrouter/free");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(saved ? "A key is saved in this browser. Test it again before updating." : "");
  const [error, setError] = useState("");
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  async function testKey() {
    if (!apiKey.trim()) { setError("Enter your OpenRouter API key first."); return; }
    setTesting(true); setTested(false); setError(""); setMessage("");
    try {
      const response = await fetch("/api/v1/openrouter/test", {
        method: "POST",
        headers: { "X-OpenRouter-Key": apiKey.trim(), "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ model }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "OpenRouter configuration test failed.");
      setTested(true);
      setMessage("Connection verified. OpenRouter accepted the key and completed a model test.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not test this key."); }
    finally { setTesting(false); }
  }
  function save() {
    if (!tested) { setError("Run a successful connection test before saving."); return; }
    setSaving(true);
    try {
      saveOpenRouterConfig({ apiKey: apiKey.trim(), model: model.trim() || "openrouter/free" });
      setMessage("Configuration saved on this device. HERABRIUM AI is ready.");
      setError("");
    } catch { setError("This browser could not save the configuration."); }
    finally { setSaving(false); }
  }
  function clear() {
    clearOpenRouterConfig(); setApiKey(""); setTested(false); setMessage("Saved configuration cleared from this device."); setError("");
  }
  return <div className="or-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="or-panel" role="dialog" aria-modal="true" aria-labelledby="or-title">
      <style>{`
        .or-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(0,8,5,.72);backdrop-filter:blur(9px);display:flex;justify-content:flex-end;animation:orFade .22s ease}
        .or-panel{width:min(480px,100%);height:100%;overflow-y:auto;overscroll-behavior:contain;background:radial-gradient(ellipse at 90% 0%,#244c35 0,transparent 42%),linear-gradient(155deg,#07150e,#0b2115 62%,#06120c);border-left:1px solid #527c5b;color:#e2f0e5;padding:24px;box-shadow:-24px 0 80px #0008;animation:orSlide .32s cubic-bezier(.2,.8,.2,1)}
        .or-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px solid #315b43;padding-bottom:20px}.or-kicker{font:9px ui-monospace,monospace;letter-spacing:.18em;color:#9be0ad}.or-panel h2{font-size:26px;font-weight:500;letter-spacing:-.04em;margin:8px 0}.or-panel p{font-size:12px;color:#a6bfad;line-height:1.65}.or-close{border:1px solid #426b50;background:#10271a;color:#cdebd4;border-radius:8px;padding:8px;cursor:pointer}.or-field{display:block;margin:20px 0 0}.or-field>span{display:block;font:9px ui-monospace,monospace;letter-spacing:.12em;color:#a6d8b2;margin-bottom:8px}.or-input{width:100%;background:#06130c;border:1px solid #42694e;border-radius:9px;color:#eff8f0;padding:13px;outline:none;font-size:12px}.or-input:focus{border-color:#9be0ad;box-shadow:0 0 0 3px #75b98920}.or-keywrap{display:flex;gap:7px}.or-keywrap input{flex:1;min-width:0}.or-keywrap button{border:1px solid #42694e;background:#10271a;color:#cdebd4;border-radius:8px;padding:0 12px}.or-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.or-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid #6fa87d;background:linear-gradient(120deg,#245c39,#173e29);color:#f0fff3;border-radius:8px;padding:11px 14px;font-size:11px;cursor:pointer}.or-btn:disabled{opacity:.5;cursor:wait}.or-secondary{background:#10271a;border-color:#42694e;color:#b9ddc2}.or-status{margin-top:14px;padding:11px;border:1px solid #3d6549;border-radius:9px;background:#0a1c12;color:#aee3ba;font-size:11px;line-height:1.55}.or-error{margin-top:14px;padding:11px;border:1px solid #77513d;border-radius:9px;background:#25170f;color:#ffc3a3;font-size:11px;line-height:1.55}.or-note{margin-top:20px;padding:13px;border:1px solid #4c633e;border-radius:10px;background:#1c2113}.or-note strong{display:flex;gap:7px;align-items:center;font:9px ui-monospace,monospace;color:#d6d39b;letter-spacing:.08em}.or-note p{margin:8px 0 0;font-size:10px}.or-bottom{margin-top:22px;border-top:1px solid #315b43;padding-top:16px;color:#7f9e88;font:8px ui-monospace,monospace;line-height:1.7}
        @keyframes orFade{from{opacity:0}to{opacity:1}}@keyframes orSlide{from{transform:translateX(40px);opacity:.6}to{transform:translateX(0);opacity:1}}@media(prefers-reduced-motion:reduce){.or-backdrop,.or-panel{animation:none}}
      `}</style>
      <div className="or-head"><div><span className="or-kicker">NEXUS SYSTEM / AI PROVIDER</span><h2 id="or-title">OpenRouter connection</h2><p>Connect a model to help HERABRIUM interpret retrieved botanical evidence, organize search results and draft structured species profiles.</p></div><button className="or-close" onClick={onClose} aria-label="Close settings"><X size={18}/></button></div>
      <label className="or-field"><span>OPENROUTER API KEY</span><div className="or-keywrap"><input className="or-input" type={showKey?"text":"password"} autoComplete="off" spellCheck={false} value={apiKey} onChange={event=>{setApiKey(event.target.value);setTested(false);setMessage("");setError("");}} placeholder="sk-or-v1-…"/><button onClick={()=>setShowKey(v=>!v)} aria-label={showKey?"Hide API key":"Show API key"}>{showKey?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
      <label className="or-field"><span>MODEL ROUTER</span><input className="or-input" value={model} onChange={event=>{setModel(event.target.value);setTested(false);setMessage("");}} placeholder="openrouter/free"/></label>
      <div className="or-actions"><button className="or-btn" onClick={testKey} disabled={testing||!apiKey.trim()}>{testing?<LoaderCircle size={14}/>:<Sparkles size={14}/>} {testing?"Testing connection…":"Test configuration"}</button><button className="or-btn" onClick={save} disabled={!tested||saving}><Save size={14}/> {saving?"Saving…":"Save configuration"}</button></div>
      {message&&<div className="or-status"><CheckCircle2 size={14} style={{verticalAlign:"middle",marginRight:6}}/>{message}</div>}
      {error&&<div className="or-error">{error}</div>}
      <div className="or-note"><strong><ShieldCheck size={14}/> KEY STORAGE & PRIVACY</strong><p>Your key is saved only in this browser's local storage. HERABRIUM sends it to its same-origin backend proxy in an authorization header; the backend does not save or log it. Anyone with access to this browser profile can access its locally saved key. Do not use a shared or public device.</p></div>
      {saved&&<div className="or-actions"><button className="or-btn or-secondary" onClick={clear}>Clear saved key</button></div>}
      <div className="or-bottom">HERABRIUM AI / SOURCE-GROUNDED MODE<br/>AI INTERPRETATION IS NOT A SUBSTITUTE FOR TAXONOMIC REVIEW. PUBLIC SOURCE RECORDS REMAIN THE EVIDENCE OF RECORD.</div>
    </aside>
  </div>;
}
