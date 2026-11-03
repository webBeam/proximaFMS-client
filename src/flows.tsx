import { useEffect, useMemo, useRef, useState } from 'react'
import type { ClipboardEvent, KeyboardEvent, PointerEvent } from 'react'
import { BadgeCheck, Building2, Check, CreditCard, Eraser, Landmark, Loader2, PenLine, QrCode, ShieldCheck, Smartphone, Stamp } from 'lucide-react'
import { money } from './data'
import type { Listing } from './data'

/* deterministic pseudo-random from a string */
function rng(seed:string) {
  let h = 1779033703 ^ seed.length
  for (let i=0;i<seed.length;i++) {h = Math.imul(h ^ seed.charCodeAt(i),3432918353);h = h<<13 | h>>>19}
  return () => {h = Math.imul(h ^ h>>>16,2246822507);h = Math.imul(h ^ h>>>13,3266489909);return ((h ^= h>>>16)>>>0)/4294967296}
}
const hex = (bytes:number) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)),b=>b.toString(16).padStart(2,'0')).join('')
const colombo = () => new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Colombo'}).format(new Date())+' (Asia/Colombo)'

export function QrArt({seed,size=168}:{seed:string; size?:number}) {
  const cells = useMemo(()=>{
    const n = 25, rand = rng(seed), out:[number,number][] = []
    const finder = (x:number,y:number) => (x<7&&y<7)||(x>=n-7&&y<7)||(x<7&&y>=n-7)
    for (let y=0;y<n;y++) for (let x=0;x<n;x++) if (!finder(x,y) && rand()>.52) out.push([x,y])
    return out
  },[seed])
  const eye = (x:number,y:number) => <g key={x+'-'+y}><rect x={x} y={y} width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1"/><rect x={x+2} y={y+2} width="3" height="3" rx=".8" fill="currentColor"/></g>
  return <svg className="qr" width={size} height={size} viewBox="-1 -1 27 27" role="img" aria-label="Payment QR code (demo)"><rect x="-1" y="-1" width="27" height="27" rx="3" fill="#fff"/><g fill="currentColor">{cells.map(([x,y])=><rect key={x+'.'+y} x={x+.08} y={y+.08} width=".84" height=".84" rx=".25"/>)}</g>{eye(.5,.5)}{eye(17.5,.5)}{eye(.5,17.5)}</svg>
}

function Steps({labels,at}:{labels:string[]; at:number}) {
  return <ol className="flow-steps">{labels.map((label,index)=><li key={label} className={index<at?'done':index===at?'now':''}><i>{index<at?<Check size={12}/>:index+1}</i><span>{label}</span></li>)}</ol>
}

/* ---------------- lease signing ---------------- */
type Lang = 'en'|'si'|'ta'
function clauses(l:Listing, lang:Lang) {
  const rent = l.rent.toLocaleString('en-LK'), dep = (l.rent*l.depositMonths).toLocaleString('en-LK'), m = l.depositMonths
  if (lang==='si') return [
    ['කුලිය',`මසකට රු. ${rent}, සෑම මසකම 5 වනදාට පෙර ගෙවිය යුතුය.`],
    ['තැන්පතුව',`රු. ${dep} (මාස ${m}), ඉවත්වීමේ පරීක්ෂාවෙන් පසු ආපසු ගෙවනු ලැබේ.`],
    ['කාලය','2026 දෙසැම්බර් 1 සිට මාස 12, අවසන් කිරීමට දින 30 ක දැනුම්දීමක්.'],
    ['අලුත්වැඩියා','ProximaFMS හරහා වාර්තා කරන්න; ව්‍යුහාත්මක හා ජල නල අලුත්වැඩියා අයිතිකරු භාර වේ.'],
    ['ප්‍රමාද ගාස්තුව','දින 3 ක සහන කාලයෙන් පසු රු. 1,000, උපරිමය රු. 5,000.'],
  ]
  if (lang==='ta') return [
    ['வாடகை',`மாதம் ரூ. ${rent}, ஒவ்வொரு மாதமும் 5ஆம் தேதிக்குள் செலுத்த வேண்டும்.`],
    ['வைப்புத்தொகை',`ரூ. ${dep} (${m} மாதங்கள்), வெளியேறும் ஆய்வுக்குப் பின் திருப்பித் தரப்படும்.`],
    ['காலம்','2026 டிசம்பர் 1 முதல் 12 மாதங்கள், முடிக்க 30 நாள் அறிவிப்பு.'],
    ['பழுதுபார்ப்பு','ProximaFMS மூலம் தெரிவிக்கவும்; கட்டமைப்பு மற்றும் குழாய் பழுதுகளை உரிமையாளர் கவனிப்பார்.'],
    ['தாமதக் கட்டணம்','3 நாள் சலுகைக்குப் பின் ரூ. 1,000, அதிகபட்சம் ரூ. 5,000.'],
  ]
  return [
    ['Rent',`LKR ${rent} per month, due on the 5th of each month.`],
    ['Deposit',`LKR ${dep} (${m} months), refunded after the move-out inspection.`],
    ['Term','12 months from 1 December 2026, with 30 days’ notice to end.'],
    ['Repairs','Report through ProximaFMS. The owner handles structural and plumbing repairs.'],
    ['Late fee','LKR 1,000 after a 3-day grace period, capped at LKR 5,000.'],
  ]
}

function SignaturePad({onChange}:{onChange:(signed:boolean)=>void}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<[number,number]|null>(null)
  useEffect(()=>{
    const c = canvas.current; if (!c) return
    const ratio = window.devicePixelRatio||1
    c.width = c.offsetWidth*ratio; c.height = c.offsetHeight*ratio
    const ctx = c.getContext('2d'); if (!ctx) return
    ctx.scale(ratio,ratio); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=2.6
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#0f1f19'
  },[])
  const point = (e:PointerEvent<HTMLCanvasElement>):[number,number] => {const r=e.currentTarget.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]}
  const down = (e:PointerEvent<HTMLCanvasElement>) => {e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;last.current=point(e)}
  const move = (e:PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current||!last.current) return
    const ctx = e.currentTarget.getContext('2d'); if (!ctx) return
    const p = point(e)
    ctx.beginPath(); ctx.moveTo(...last.current); ctx.lineTo(...p); ctx.stroke()
    last.current = p; onChange(true)
  }
  const up = () => {drawing.current=false;last.current=null}
  const clear = () => {const c=canvas.current;const ctx=c?.getContext('2d');if(c&&ctx){ctx.clearRect(0,0,c.width,c.height)};onChange(false)}
  return <div className="sigpad"><canvas ref={canvas} aria-label="Signature pad. Draw your signature with a mouse, finger or stylus." onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}/><span className="sig-line">Sign above the line</span><button type="button" className="link" onClick={clear}><Eraser size={14}/> Clear</button></div>
}

function Otp({code,onDone}:{code:string; onDone:()=>void}) {
  const [digits,setDigits] = useState(Array(6).fill(''))
  const [bad,setBad] = useState(false)
  const refs = useRef<(HTMLInputElement|null)[]>([])
  useEffect(()=>{refs.current[0]?.focus()},[])
  const commit = (next:string[]) => {
    setDigits(next)
    if (next.every(Boolean)) {
      if (next.join('')===code) onDone()
      else {setBad(true);window.setTimeout(()=>{setBad(false);setDigits(Array(6).fill(''));refs.current[0]?.focus()},650)}
    }
  }
  const type = (i:number,v:string) => {const d=v.replace(/\D/g,'').slice(-1);const next=[...digits];next[i]=d;commit(next);if(d&&i<5)refs.current[i+1]?.focus()}
  const key = (i:number,e:KeyboardEvent<HTMLInputElement>) => {if(e.key==='Backspace'&&!digits[i]&&i>0)refs.current[i-1]?.focus()}
  const paste = (e:ClipboardEvent<HTMLInputElement>) => {const d=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6).split('');if(d.length){e.preventDefault();const next=Array(6).fill('').map((_,i)=>d[i]??'');commit(next);refs.current[Math.min(d.length,5)]?.focus()}}
  return <div className="otp-wrap">
    <div className={'otp'+(bad?' bad':'')} role="group" aria-label="One-time password">{digits.map((d,i)=><input key={i} ref={el=>{refs.current[i]=el}} inputMode="numeric" autoComplete="one-time-code" maxLength={1} aria-label={'Digit '+(i+1)} value={d} onChange={e=>type(i,e.target.value)} onKeyDown={e=>key(i,e)} onPaste={paste}/>)}</div>
    <p className="otp-hint"><Smartphone size={15}/> Sent to +94 77 ••• 4821. Demo code <b>{code}</b> <button type="button" className="link" onClick={()=>commit(code.split(''))}>Fill it for me</button></p>
    {bad&&<p className="error" role="alert">That code doesn’t match. Try again.</p>}
  </div>
}

export function SignFlow({listing,signer,role,onSigned,onClose}:{listing:Listing; signer:string; role:'Tenant'|'Owner'; onSigned:()=>void; onClose:()=>void}) {
  const [step,setStep] = useState(0)
  const [lang,setLang] = useState<Lang>('en')
  const [read,setRead] = useState(0)
  const [agree,setAgree] = useState(false)
  const [signed,setSigned] = useState(false)
  const code = useMemo(()=>String(100000+Math.floor(Math.random()*900000)),[])
  const hash = useMemo(()=>hex(32),[])
  const stamp = useMemo(colombo,[step===3])
  const list = clauses(listing,lang)
  return <div className="flow">
    <Steps labels={['Review','Sign','Verify','Sealed']} at={step}/>
    {step===0&&<div className="flow-body">
      <div className="doc-head"><div><b>Residential tenancy agreement</b><small>{listing.title} · {listing.location} · template v3.2</small></div><div className="seg" role="group" aria-label="Agreement language">{(['en','si','ta'] as Lang[]).map(l=><button key={l} type="button" aria-pressed={lang===l} onClick={()=>setLang(l)}>{l==='en'?'English':l==='si'?'සිංහල':'தமிழ்'}</button>)}</div></div>
      <div className="doc" tabIndex={0} onScroll={e=>{const t=e.currentTarget;setRead(Math.min(1,(t.scrollTop+t.clientHeight)/t.scrollHeight))}}>
        <p className="doc-parties">Between <b>Nimal Perera</b> (owner) and <b>Anjali Fernando</b> (tenant), for {listing.title}, {listing.location}.</p>
        {list.map(([title,text],i)=><section key={title}><h4>{i+1}. {title}</h4><p>{text}</p></section>)}
        <p className="doc-note">If the language versions differ, the English version prevails. Mandatory clauses are protected and cannot be removed.</p>
      </div>
      <div className="read-bar" aria-hidden="true"><i style={{transform:`scaleX(${Math.max(read,.18)})`}}/></div>
      <label className="check"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/><span>I have read the agreement and accept its terms</span></label>
      <div className="flow-actions"><button type="button" className="btn primary" disabled={!agree} onClick={()=>setStep(1)}><PenLine size={16}/> Continue to sign</button></div>
    </div>}
    {step===1&&<div className="flow-body">
      <p className="flow-lead">Draw your signature. It is bound to your verified account as <b>{signer}</b>.</p>
      <SignaturePad onChange={setSigned}/>
      <div className="flow-actions"><button type="button" className="btn" onClick={()=>setStep(0)}>Back</button><button type="button" className="btn primary" disabled={!signed} onClick={()=>setStep(2)}>Apply signature</button></div>
    </div>}
    {step===2&&<div className="flow-body center">
      <span className="flow-icon"><ShieldCheck size={26}/></span><h3>Confirm it’s you</h3><p className="flow-lead">Every signature needs a one-time password.</p>
      <Otp code={code} onDone={()=>{setStep(3);onSigned()}}/>
    </div>}
    {step===3&&<div className="flow-body center">
      <div className="seal"><Stamp size={30}/><span>SEALED</span></div>
      <h3>{role==='Tenant'?'Signed. Waiting for the owner.':'Agreement executed.'}</h3>
      <div className="cert">
        <QrArt seed={hash} size={112}/>
        <dl><div><dt>Signer</dt><dd>{signer}</dd></div><div><dt>Time</dt><dd>{stamp}</dd></div><div><dt>Document hash</dt><dd className="mono">{hash.slice(0,16)}…{hash.slice(-8)}</dd></div><div><dt>Method</dt><dd>Drawn signature + OTP</dd></div></dl>
      </div>
      <p className="muted">Anyone can scan the code to verify this sealed copy.</p>
      <div className="flow-actions"><button type="button" className="btn primary" onClick={onClose}><BadgeCheck size={16}/> Done</button></div>
    </div>}
  </div>
}

/* ---------------- rent checkout ---------------- */
export function PayFlow({amount,label,onPaid,onClose}:{amount:number; label:string; onPaid:(method:string)=>void; onClose:()=>void}) {
  const [method,setMethod] = useState<'card'|'qr'|'bank'>('qr')
  const [phase,setPhase] = useState<'choose'|'pay'|'processing'|'done'>('choose')
  const [left,setLeft] = useState(300)
  const ref = useMemo(()=>'PFM-'+hex(3).toUpperCase(),[])
  const receipt = useMemo(()=>'REC-'+hex(2).toUpperCase(),[])
  useEffect(()=>{
    if (phase!=='pay'||method!=='qr') return
    const t = window.setInterval(()=>setLeft(s=>Math.max(0,s-1)),1000)
    return () => window.clearInterval(t)
  },[phase,method])
  const methods = [
    {id:'qr' as const,icon:QrCode,title:'LANKAQR',detail:'Scan with any banking app'},
    {id:'card' as const,icon:CreditCard,title:'Card',detail:'Visa or Mastercard, 3-D Secure'},
    {id:'bank' as const,icon:Landmark,title:'Bank transfer',detail:'CEFTS with a reference'},
  ]
  const name = methods.find(m=>m.id===method)!.title
  const process = () => {setPhase('processing');window.setTimeout(()=>{setPhase('done');onPaid(name)},1600)}
  return <div className="flow">
    <Steps labels={['Method','Pay','Receipt']} at={phase==='choose'?0:phase==='done'?2:1}/>
    {phase==='choose'&&<div className="flow-body">
      <div className="bill"><div><span>{label}</span><b>{money(amount)}</b></div><div><span>Platform fee</span><b>LKR 0</b></div><div className="bill-total"><span>Total</span><b>{money(amount)}</b></div></div>
      <div className="methods" role="radiogroup" aria-label="Payment method">{methods.map(m=>{const I=m.icon;return <button key={m.id} type="button" role="radio" aria-checked={method===m.id} onClick={()=>setMethod(m.id)}><span><I size={20}/></span><b>{m.title}</b><small>{m.detail}</small><i/></button>})}</div>
      <div className="flow-actions"><button type="button" className="btn primary" onClick={()=>setPhase('pay')}>Continue with {name}</button></div>
    </div>}
    {phase==='pay'&&method==='qr'&&<div className="flow-body center">
      <div className="qr-box"><QrArt seed={ref}/><span className="qr-logo"><Building2 size={16}/></span></div>
      <p className="flow-lead">Scan to pay <b>{money(amount)}</b>. Code expires in <b>{Math.floor(left/60)}:{String(left%60).padStart(2,'0')}</b></p>
      <div className="flow-actions"><button type="button" className="btn" onClick={()=>setPhase('choose')}>Back</button><button type="button" className="btn primary" onClick={process}><Smartphone size={16}/> Simulate scan</button></div>
    </div>}
    {phase==='pay'&&method==='card'&&<div className="flow-body">
      <div className="card-art"><span>ProximaFMS demo</span><b>4242 4242 4242 4242</b><small><span>ANJALI FERNANDO</span><span>12/29</span></small></div>
      <p className="muted center-text">Demo card details are filled in. Nothing is charged.</p>
      <div className="flow-actions"><button type="button" className="btn" onClick={()=>setPhase('choose')}>Back</button><button type="button" className="btn primary" onClick={process}><ShieldCheck size={16}/> Pay {money(amount)}</button></div>
    </div>}
    {phase==='pay'&&method==='bank'&&<div className="flow-body">
      <div className="bill"><div><span>Account name</span><b>ProximaFMS Collections</b></div><div><span>Bank</span><b>Demo Bank PLC</b></div><div><span>Account no.</span><b className="mono">0081 2245 7719</b></div><div className="bill-total"><span>Use reference</span><b className="mono">{ref}</b></div></div>
      <p className="muted center-text">Transfers are matched automatically using the reference.</p>
      <div className="flow-actions"><button type="button" className="btn" onClick={()=>setPhase('choose')}>Back</button><button type="button" className="btn primary" onClick={process}>I’ve made the transfer</button></div>
    </div>}
    {phase==='processing'&&<div className="flow-body center"><Loader2 className="spin" size={40}/><h3>Confirming with your bank…</h3><p className="muted">Verifying the gateway signature. You’re never charged twice.</p></div>}
    {phase==='done'&&<div className="flow-body center">
      <span className="flow-icon ok"><Check size={30}/></span><h3>Payment received</h3>
      <div className="receipt"><div><span>Receipt</span><b className="mono">{receipt}</b></div><div><span>{label}</span><b>{money(amount)}</b></div><div><span>Method</span><b>{name}</b></div><div><span>Paid</span><b>{colombo()}</b></div></div>
      <p className="muted">A copy is on its way by SMS and email.</p>
      <div className="flow-actions"><button type="button" className="btn primary" onClick={onClose}>Done</button></div>
    </div>}
  </div>
}

/* ---------------- repair tracker ---------------- */
const repairStages = ['Reported','Open for quotes','Quote submitted','Awarded','In progress','Awaiting tenant confirmation','Awaiting payout approval','Completed']
const repairLabels = ['Reported','Job posted','Quoted','Awarded','In progress','Fixed','Confirmed','Paid']
export function RepairTrack({status}:{status:string}) {
  const at = Math.max(0,repairStages.indexOf(status))
  const pct = at/(repairStages.length-1)*100
  return <div className="track" aria-label={'Repair progress: '+repairLabels[at]}>
    <div className="track-bar"><i style={{width:pct+'%'}}/><span className="track-head" style={{left:pct+'%'}}>{at===repairStages.length-1?<Check size={13}/>:<span className="pulse"/>}</span></div>
    <ol>{repairLabels.map((label,index)=><li key={label} className={index<=at?'on':''}>{label}</li>)}</ol>
  </div>
}
