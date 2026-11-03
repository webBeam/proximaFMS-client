import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, BadgeCheck, Play, Building2, Camera, Home, Languages, MapPin, Search, ShieldCheck, Wallet, Wrench } from 'lucide-react'
import { money } from './data'
import type { Listing, Role } from './data'
import { copy, langs } from './i18n'
import type { Lang } from './i18n'
import { RoleArt } from './art'
import { CountUp, Journey, journeySteps, Photo, tilt, TrustBadge, useReveal } from './ui'

const roles = [
  { label:'Find a home', icon:Home, title:'From browsing to moving in.', detail:'Search verified homes, see the full move-in cost, apply, reserve and e-sign without leaving the app.', role:'Tenant' as Role, cta:'Open tenant space' },
  { label:'Manage a property', icon:Building2, title:'Run your rental from one place.', detail:'Publish listings, compare applicants, collect rent and approve repairs with a live portfolio dashboard.', role:'Investor' as Role, cta:'Open investor space' },
  { label:'Take repair jobs', icon:Wrench, title:'Find jobs that match your trade.', detail:'Browse nearby service requests, send a quote and get paid as soon as the work is approved.', role:'Craftsman' as Role, cta:'Open craftsman space' },
]
const slides = [
  { kind:'House', id:'garden', caption:'Garden homes', place:'Battaramulla' },
  { kind:'House', id:'villa', caption:'Modern villas', place:'Kotte' },
  { kind:'House', id:'pool', caption:'Homes with a pool', place:'Mount Lavinia' },
  { kind:'Apartment', id:'PF-101', caption:'City apartments', place:'Rajagiriya' },
]
const stepInfo: { who:string; points:string[] }[] = [
  { who:'Owner · Platform', points:['Owner adds photos, rent and house rules','Identity and ownership are verified (L1 to L3)','Duplicate or stock photos are caught automatically'] },
  { who:'Tenant', points:['Search by area, price and amenities','Compare up to four homes side by side','Request a viewing and chat in-app'] },
  { who:'Tenant · Owner', points:['Apply with household details','Owner compares applicants and approves','Hold the unit with a refundable reservation'] },
  { who:'Tenant · Owner', points:['Read the agreement in English, Sinhala or Tamil','Negotiate clauses with a clear redline','Sign online with OTP and a sealed certificate'] },
  { who:'Tenant · Platform', points:['Invoices arrive before the due date','Pay by card, bank transfer or QR','Receipts and reminders in your language'] },
  { who:'Tenant · Owner · Craftsman', points:['Report an issue with photos','Owner approves a job, craftsmen send quotes','Funds release only after the work is approved'] },
  { who:'Tenant · Owner', points:['Renew, extend or give notice with clear dates','Move-out inspection against the move-in baseline','Deposit settled with evidence, fairly'] },
]

const ticker = ['Rent paid · Nugegoda · 2 min ago','New verified listing · Rajagiriya','Lease e-signed · Battaramulla','Plumbing job completed · Dehiwala','Deposit refunded in full · Kotte','Application approved · Mount Lavinia','Craftsman verified · Maharagama']

type Props = { listings:Listing[]; extras:ReactNode; enter:(role:Role,page?:string,query?:string)=>void; startTour:()=>void }
export default function Landing({listings,extras,enter,startTour}:Props) {
  useReveal()
  const [query,setQuery] = useState('')
  const [focus,setFocus] = useState(false)
  const [role,setRole] = useState(0)
  const [slide,setSlide] = useState(0)
  const [hold,setHold] = useState(false)
  const [step,setStep] = useState(4)
  const [rent,setRent] = useState(85000)
  const [dep,setDep] = useState(2)
  const [adv,setAdv] = useState(1)
  const [lang,setLang] = useState<Lang>(()=>{try{const v=localStorage.getItem('proxima-lang');return langs.some(l=>l.id===v)?v as Lang:'en'}catch{return 'en'}})
  const t = copy[lang]
  const pick = (next:Lang) => {setLang(next);try{localStorage.setItem('proxima-lang',next)}catch{/* applies for this session */}}
  useEffect(()=>{
    if (hold) return
    const timer = window.setInterval(()=>setSlide(s=>(s+1)%slides.length),6000)
    return () => window.clearInterval(timer)
  },[hold])
  const active = roles[role]
  const q = query.trim().toLowerCase()
  const matches = listings.filter(l=>!q||(l.title+' '+l.location).toLowerCase().includes(q)).slice(0,4)
  const places = ['Rajagiriya','Nugegoda','Battaramulla','Dehiwala','Kotte']
  const deposit = rent*dep, advance = rent*adv, total = deposit+advance
  const info = stepInfo[step]
  return <div className="landing">
    <header className="l-bar">
      <a className="logo" href="#top"><span><Home size={18}/></span>Proxima<b>FMS</b></a>
      <nav aria-label="Public site"><a href="#rentals">{t.navRentals}</a><a href="#calculator">Cost calculator</a><a href="#journey">{t.navHow}</a><a href="#trust">{t.navTrust}</a></nav>
      <div className="l-tools"><div className="lang" role="group" aria-label="Language"><Languages size={15} aria-hidden="true"/>{langs.map(l=><button key={l.id} title={l.name} aria-pressed={lang===l.id} onClick={()=>pick(l.id)}>{l.label}</button>)}</div>{extras}<a className="btn primary" href="#roles">{t.cta} <ArrowRight size={16}/></a></div>
    </header>
    <section className="l-hero" id="top" onMouseEnter={()=>setHold(true)} onMouseLeave={()=>setHold(false)}>
      <div className="l-hero-photo" aria-hidden="true">{slides.map((s,i)=><div key={s.id} className={'slide'+(i===slide?' on':'')}><Photo kind={s.kind} id={s.id} eager={i===0}/></div>)}</div>
      <div className="l-hero-inner">
        <span className="pill-kicker"><i/> {t.kicker}</span>
        <h1>{t.h1a}<br/><em>{t.h1b}</em></h1>
        <p>{t.sub}</p>
        <div className="l-search-wrap" data-tour="search" onFocus={()=>setFocus(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false)}}>
          <form className="l-search" onSubmit={e=>{e.preventDefault();enter('Tenant','Find a rental',query.trim())}}>
            <MapPin size={20} aria-hidden="true"/><label><span>{t.where}</span><input aria-label="Search by property or neighbourhood" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.placeholder}/></label><button className="btn primary"><Search size={17}/> {t.find}</button>
          </form>
          {focus&&<div className="suggest" role="listbox" aria-label="Suggestions">
            {matches.length?matches.map(l=><button type="button" key={l.id} role="option" aria-selected="false" onClick={()=>enter('Tenant','Find a rental',l.title)}><span className="s-photo"><Photo kind={l.kind} id={l.id}/></span><span><b>{l.title}</b><small>{l.location} · {l.kind}</small></span><em>{money(l.rent)}</em></button>):<p>No homes match “{query}”. Try a neighbourhood below.</p>}
            <div className="s-places">{places.map(p=><button type="button" key={p} onClick={()=>enter('Tenant','Find a rental',p)}><MapPin size={12}/>{p}</button>)}</div>
          </div>}
        </div>
        <div className="l-places"><span>{t.places}</span>{places.slice(0,4).map(p=><button key={p} onClick={()=>enter('Tenant','Find a rental',p)}>{p}</button>)}</div>
        <button className="play" onClick={startTour}><span><Play size={16}/></span><b>Play the 2-minute tour</b></button>
      </div>
      <div className="hero-dock">
        <div className="dock-stats"><div><strong>L1–L3</strong><span>trust levels</span></div><div><strong>3</strong><span>languages</span></div><div><strong>7</strong><span>lifecycle steps</span></div></div>
        <div className="dock-slides"><span><b>{slides[slide].caption}</b><small>{slides[slide].place}</small></span><div role="group" aria-label="Hero photos">{slides.map((s,i)=><button key={s.id} aria-label={s.caption} aria-pressed={i===slide} onClick={()=>setSlide(i)}/>)}</div></div>
      </div>
    </section>
    <div className="ticker" aria-label="Recent activity"><div className="ticker-track">{[...ticker,...ticker].map((item,i)=><span key={i} aria-hidden={i>=ticker.length}><i/>{item}</span>)}</div></div>
    <main>
      <section className="stats reveal" aria-label="Platform highlights">
        <div><strong><CountUp to={3}/></strong><span>languages</span><small>English · සිංහල · தமிழ்</small></div>
        <div><strong>L1–L3</strong><span>trust levels</span><small>Owners and properties checked</small></div>
        <div><strong><CountUp to={7}/></strong><span>lifecycle steps</span><small>Advert to deposit refund</small></div>
        <div><strong><CountUp to={24}/>h</strong><span>cooling-off</span><small>Automatic reservation refunds</small></div>
      </section>
      <section id="rentals" className="l-section reveal">
        <div className="l-head"><div><span className="eyebrow">{t.collection}</span><h2>{t.featured}</h2></div><button className="link" onClick={()=>enter('Tenant','Find a rental')}>{t.browseAll} <ArrowRight size={16}/></button></div>
        <div className="grid-cards">{listings.slice(0,3).map(l=><button key={l.id} className="l-card tilt" {...tilt} onClick={()=>enter('Tenant','Find a rental',l.title)}><span className="l-card-art"><Photo kind={l.kind} id={l.id}/><span className="photo-badge"><TrustBadge level={l.trust}/></span></span><strong>{l.title}</strong><span className="l-card-meta"><span><MapPin size={14}/> {l.location}</span><span><b>{money(l.rent)}</b> / month</span></span></button>)}</div>
      </section>
      <section id="calculator" className="l-section reveal">
        <div className="l-head"><div><span className="eyebrow">Plan with confidence</span><h2>Know your move-in cost before you apply</h2></div></div>
        <div className="calc" data-tour="calc">
          <div className="calc-in">
            <label className="range"><span>Monthly rent</span><strong>{money(rent)}</strong><input type="range" min={20000} max={150000} step={1000} value={rent} onChange={e=>setRent(Number(e.target.value))} aria-label="Monthly rent"/><small><span>LKR 20k</span><span>LKR 150k</span></small></label>
            <div className="seg-row"><span>Deposit</span><div className="seg" role="group" aria-label="Deposit months">{[1,2,3].map(n=><button key={n} aria-pressed={dep===n} onClick={()=>setDep(n)}>{n} {n===1?'month':'months'}</button>)}</div></div>
            <div className="seg-row"><span>Advance</span><div className="seg" role="group" aria-label="Advance months">{[0,1,2].map(n=><button key={n} aria-pressed={adv===n} onClick={()=>setAdv(n)}>{n===0?'None':n+(n===1?' month':' months')}</button>)}</div></div>
          </div>
          <div className="calc-out" aria-live="polite">
            <span>Due at move-in</span><strong>{money(total)}</strong>
            <div className="stackbar" aria-hidden="true"><i className="a" style={{flex:deposit||1}}/><i className="b" style={{flex:advance||0.0001}}/></div>
            <dl><div><dt><i className="a"/>Deposit · {dep} {dep===1?'month':'months'}</dt><dd>{money(deposit)}</dd></div><div><dt><i className="b"/>Advance · {adv===0?'none':adv+(adv===1?' month':' months')}</dt><dd>{money(advance)}</dd></div><div><dt>Then every month</dt><dd>{money(rent)}</dd></div></dl>
            <button className="btn primary" onClick={()=>enter('Tenant','Find a rental')}>Find homes in this range <ArrowRight size={16}/></button>
          </div>
        </div>
      </section>
      <section id="journey" className="l-section reveal">
        <div className="l-head"><div><span className="eyebrow">{t.journeyKicker}</span><h2>{t.journeyTitle}</h2></div></div>
        <div className="panel"><Journey current={4} selected={step} onSelect={setStep}/>
          <div className="step-info" aria-live="polite" key={step}><span className="step-icon">{(()=>{const I=journeySteps[step].icon;return <I size={22}/>})()}</span><div><h3>{step+1}. {journeySteps[step].title}</h3><small>{info.who}</small></div><ul>{info.points.map(p=><li key={p}><BadgeCheck size={16}/>{p}</li>)}</ul></div>
        </div>
      </section>
      <section id="trust" className="l-section reveal">
        <div className="l-head"><div><span className="eyebrow">{t.trustKicker}</span><h2>{t.trustTitle}</h2></div></div>
        <div className="grid-4 trust-grid">
          {[[BadgeCheck,'Verified owners','Identity and ownership are checked before an ad goes live, with L1 to L3 badges on every listing.','mint'],[Camera,'Real photos only','Reused or stock images are detected automatically and exact addresses stay private until approval.','lime'],[Wallet,'Clear costs upfront','Rent, deposit and advance are shown before you apply, so move-in has no surprises.','sun'],[ShieldCheck,'Fair disputes','Evidence-based workflows, one appeal, and only the disputed amount is ever held.','coral']].map(([I,title,text,tone])=>{const Ic=I as typeof BadgeCheck;return <article key={title as string} className="tile"><span className={'tile-icon '+tone}><Ic size={22}/></span><h3>{title as string}</h3><p>{text as string}</p></article>})}
        </div>
      </section>
      <section id="roles" className="l-section roles reveal">
        <div className="l-head"><div><span className="eyebrow">Choose a role</span><h2>How will you use ProximaFMS?</h2></div></div>
        <div className="role-tabs" role="tablist">{roles.map((r,i)=>{const I=r.icon;return <button key={r.role} role="tab" aria-selected={role===i} onClick={()=>setRole(i)}><I size={17}/>{r.label}</button>})}</div>
        <div className="role-panel" aria-live="polite" key={role}><RoleArt role={active.role}/><div><h3>{active.title}</h3><p>{active.detail}</p></div><button className="btn primary" onClick={()=>enter(active.role)}>{active.cta} <ArrowRight size={16}/></button></div>
      </section>
      <footer className="l-foot"><span>ProximaFMS · Client demo · Sample listings and illustrative photos</span><button className="link" onClick={()=>enter('Admin')}><ShieldCheck size={16}/> Open admin workspace</button></footer>
    </main>
  </div>
}
