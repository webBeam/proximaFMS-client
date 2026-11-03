import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, BadgeCheck, Building2, Camera, Home, Languages, MapPin, Search, ShieldCheck, Wallet, Wrench } from 'lucide-react'
import { money } from './data'
import type { Listing, Role } from './data'
import { copy, langs } from './i18n'
import type { Lang } from './i18n'
import { Journey, Photo, TrustBadge } from './ui'

const roles = [
  { label:'Find a home', icon:Home, title:'From browsing to moving in.', detail:'Search verified homes, see the full move-in cost, apply, reserve and e-sign without leaving the app.', role:'Tenant' as Role, cta:'Open tenant space' },
  { label:'Manage a property', icon:Building2, title:'Run your rental from one place.', detail:'Publish listings, compare applicants, collect rent and approve repairs with a live portfolio dashboard.', role:'Investor' as Role, cta:'Open investor space' },
  { label:'Take repair jobs', icon:Wrench, title:'Find jobs that match your trade.', detail:'Browse nearby service requests, send a quote and get paid as soon as the work is approved.', role:'Craftsman' as Role, cta:'Open craftsman space' },
]

type Props = { listings:Listing[]; extras:ReactNode; enter:(role:Role,page?:string,query?:string)=>void }
export default function Landing({listings,extras,enter}:Props) {
  const [query,setQuery] = useState('')
  const [role,setRole] = useState(0)
  const [lang,setLang] = useState<Lang>(()=>{try{const v=localStorage.getItem('proxima-lang');return langs.some(l=>l.id===v)?v as Lang:'en'}catch{return 'en'}})
  const t = copy[lang]
  const pick = (next:Lang) => {setLang(next);try{localStorage.setItem('proxima-lang',next)}catch{/* applies for this session */}}
  const active = roles[role]
  const Icon = active.icon
  return <div className="landing">
    <header className="l-bar">
      <a className="logo" href="#top"><span><Home size={18}/></span>Proxima<b>FMS</b></a>
      <nav aria-label="Public site"><a href="#rentals">{t.navRentals}</a><a href="#journey">{t.navHow}</a><a href="#trust">{t.navTrust}</a></nav>
      <div className="l-tools"><div className="lang" role="group" aria-label="Language"><Languages size={15} aria-hidden="true"/>{langs.map(l=><button key={l.id} title={l.name} aria-pressed={lang===l.id} onClick={()=>pick(l.id)}>{l.label}</button>)}</div>{extras}<a className="btn primary" href="#roles">{t.cta} <ArrowRight size={16}/></a></div>
    </header>
    <section className="l-hero" id="top">
      <div className="l-hero-photo"><Photo kind="House" eager/></div>
      <div className="l-hero-inner">
        <span className="pill-kicker"><i/> {t.kicker}</span>
        <h1>{t.h1a} <em>{t.h1b}</em></h1>
        <p>{t.sub}</p>
        <form className="l-search" onSubmit={e=>{e.preventDefault();enter('Tenant','Find a rental',query.trim())}}>
          <MapPin size={20} aria-hidden="true"/><label><span>{t.where}</span><input aria-label="Search by property or neighbourhood" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.placeholder}/></label><button className="btn primary"><Search size={17}/> {t.find}</button>
        </form>
        <div className="l-places"><span>{t.places}</span>{['Rajagiriya','Nugegoda','Battaramulla','Dehiwala'].map(p=><button key={p} onClick={()=>enter('Tenant','Find a rental',p)}>{p}</button>)}</div>
      </div>
      <div className="l-float f1"><BadgeCheck size={18}/><div><b>Verified owners</b><small>L1 → L3 trust levels</small></div></div>
      <div className="l-float f2"><Wallet size={18}/><div><b>No surprise costs</b><small>Deposit and advance shown upfront</small></div></div>
    </section>
    <main>
      <section className="stats" aria-label="Platform highlights">{[['3','languages','English · සිංහල · தமிழ்'],['L1–L3','trust levels','Owners and properties checked'],['7','lifecycle steps','Advert to deposit refund'],['24h','cooling-off','Automatic reservation refunds']].map(([big,label,detail])=><div key={label}><strong>{big}</strong><span>{label}</span><small>{detail}</small></div>)}</section>
      <section id="rentals" className="l-section">
        <div className="l-head"><div><span className="eyebrow">{t.collection}</span><h2>{t.featured}</h2></div><button className="link" onClick={()=>enter('Tenant','Find a rental')}>{t.browseAll} <ArrowRight size={16}/></button></div>
        <div className="grid-cards">{listings.slice(0,3).map(l=><button key={l.id} className="l-card" onClick={()=>enter('Tenant','Find a rental',l.title)}><span className="l-card-art"><Photo kind={l.kind}/><span className="photo-badge"><TrustBadge level={l.trust}/></span></span><strong>{l.title}</strong><span className="l-card-meta"><span><MapPin size={14}/> {l.location}</span><span><b>{money(l.rent)}</b> / month</span></span></button>)}</div>
      </section>
      <section id="journey" className="l-section">
        <div className="l-head"><div><span className="eyebrow">{t.journeyKicker}</span><h2>{t.journeyTitle}</h2></div></div>
        <div className="panel"><Journey current={4}/></div>
        <p className="muted note">Every step is recorded, so owners, tenants and craftsmen can all see what happened and when.</p>
      </section>
      <section id="trust" className="l-section">
        <div className="l-head"><div><span className="eyebrow">{t.trustKicker}</span><h2>{t.trustTitle}</h2></div></div>
        <div className="grid-4 trust-grid">
          {[[BadgeCheck,'Verified owners','Identity and ownership are checked before an ad goes live, with L1 to L3 badges on every listing.','mint'],[Camera,'Real photos only','Reused or stock images are detected automatically and exact addresses stay private until approval.','lime'],[Wallet,'Clear costs upfront','Rent, deposit and advance are shown before you apply, so move-in has no surprises.','sun'],[ShieldCheck,'Fair disputes','Evidence-based workflows, one appeal, and only the disputed amount is ever held.','coral']].map(([I,title,text,tone])=>{const Ic=I as typeof BadgeCheck;return <article key={title as string} className="tile"><span className={'tile-icon '+tone}><Ic size={22}/></span><h3>{title as string}</h3><p>{text as string}</p></article>})}
        </div>
      </section>
      <section id="roles" className="l-section roles">
        <div className="l-head"><div><span className="eyebrow">Choose a role</span><h2>How will you use ProximaFMS?</h2></div></div>
        <div className="role-tabs" role="tablist">{roles.map((r,i)=>{const I=r.icon;return <button key={r.role} role="tab" aria-selected={role===i} onClick={()=>setRole(i)}><I size={17}/>{r.label}</button>})}</div>
        <div className="role-panel" aria-live="polite"><span className="tile-icon mint big"><Icon size={30}/></span><div><h3>{active.title}</h3><p>{active.detail}</p></div><button className="btn primary" onClick={()=>enter(active.role)}>{active.cta} <ArrowRight size={16}/></button></div>
      </section>
      <footer className="l-foot"><span>ProximaFMS · Client demo · Sample listings and illustrative photos</span><button className="link" onClick={()=>enter('Admin')}><ShieldCheck size={16}/> Open admin workspace</button></footer>
    </main>
  </div>
}
