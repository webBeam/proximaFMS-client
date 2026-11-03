import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Building2, Home, MapPin, Search, ShieldCheck, Wrench } from 'lucide-react'
import { money } from './data'
import PropertyPhoto from './PropertyPhoto'
import './landing.css'
import type { Listing, Role } from './data'

const stories = [
  { label:'Find a home', icon:Home, title:'From browsing to moving in.', detail:'Search by neighbourhood, send an application and follow it through reservation and signing.', role:'Tenant', page:'Find a rental', cta:'Browse rentals' },
  { label:'Manage a property', icon:Building2, title:'Run your rental from one place.', detail:'Publish a listing, review applicants and stay on top of agreements, rent and repairs.', role:'Investor', page:'Overview', cta:'Open investor workspace' },
  { label:'Take on repair jobs', icon:Wrench, title:'Find jobs that match your trade.', detail:'Browse service requests, submit a quote and share proof when the work is complete.', role:'Craftsman', page:'Overview', cta:'Open craftsman workspace' },
] as const

const slides = [
  { kind:'hero', label:'Tropical houses', location:'Garden homes', caption:'Room to slow down' },
  { kind:'Apartment', label:'City apartments', location:'Apartment living', caption:'Close to the city' },
  { kind:'Boarding unit', label:'Boarding units', location:'Neighbourhood stays', caption:'A place of your own' },
] as const

type Props = {
  listings: Listing[]
  palette: ReactNode
  enter: (role:Role,page?:string,query?:string) => void
}
export default function Landing({listings,palette,enter}:Props) {
  const [query,setQuery] = useState('')
  const [story,setStory] = useState(0)
  const [slide,setSlide] = useState(0)
  const current = slides[slide]
  const changeSlide = (step:number) => setSlide(index=>(index+step+slides.length)%slides.length)
  const active = stories[story]
  const Icon = active.icon
  return <div className="landing">
    <header className="landing-bar"><a className="public-brand" href="#welcome"><span><Home size={20}/></span><div>ProximaFMS<small>RENTALS & PROPERTY CARE</small></div></a><nav aria-label="Public site"><a href="#rentals">Find a rental</a><a href="#how-it-works">How it works</a></nav><div className="landing-tools">{palette}<a className="button primary" href="#how-it-works">Explore the demo <ArrowRight size={16}/></a></div></header>
    <section className="estate-hero" id="welcome" aria-label="Discover rental homes">
      <div className="estate-photo"><PropertyPhoto key={current.kind} kind={current.kind} eager/></div>
      <div className="estate-inner">
        <div className="estate-intro"><span className="estate-kicker"><i/> THE SRI LANKAN RENTAL MARKETPLACE</span><h1>Find your place.<br/><em>Feel at home.</em></h1><p>From the first viewing to the last repair, manage your rental journey in one place.</p><a className="estate-link" href="#rentals">Explore featured rentals <ArrowRight size={18}/></a></div>
        <div className="estate-controls"><div aria-live="polite"><span>{current.location}</span><strong>{current.caption}</strong></div><div className="estate-arrows"><button type="button" aria-label="Previous property photo" onClick={()=>changeSlide(-1)}><ArrowLeft size={18}/></button><button type="button" aria-label="Next property photo" onClick={()=>changeSlide(1)}><ArrowRight size={18}/></button></div><div className="estate-dots">{slides.map((item,index)=><button key={item.kind} type="button" aria-label={item.label} aria-pressed={slide===index} onClick={()=>setSlide(index)}/>)}</div></div>
      </div>
    </section>
    <main className="estate-main">
      <form className="estate-search" onSubmit={event=>{event.preventDefault();enter('Tenant','Find a rental',query.trim())}}>
        <span className="estate-search-icon"><MapPin size={22}/></span><label><strong>Where would you like to live?</strong><input aria-label="Search by property or neighbourhood" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Enter a property name or neighbourhood"/></label><button className="button primary"><Search size={17}/> Find rentals</button>
      </form>
      <div className="estate-places"><span>Explore by neighbourhood</span>{['Rajagiriya','Nugegoda','Battaramulla'].map(place=><button key={place} onClick={()=>enter('Tenant','Find a rental',place)}>{place} <ArrowRight size={13}/></button>)}</div>
      <section id="rentals" className="landing-section">
        <div className="landing-heading"><div><span className="eyebrow">THE PROPERTY COLLECTION</span><h2>Featured rentals</h2></div><button className="link" onClick={()=>enter('Tenant','Find a rental')}>Browse all rentals <ArrowRight size={16}/></button></div>
        {listings.length ? <div className="listing-preview">{listings.slice(0,3).map((item,index)=><button key={item.id} onClick={()=>enter('Tenant','Find a rental',item.title)} className="listing-tile"><span className="tile-photo"><PropertyPhoto kind={item.kind}/></span><span className="tile-count">0{index+1} / {item.kind}</span><strong>{item.title}</strong><span className="tile-meta"><span><MapPin size={14}/> {item.location}</span><span><b>{money(item.rent)}</b> / month</span></span><ArrowRight className="tile-arrow" size={19}/></button>)}</div> : <p className="empty">No published demo listings are available.</p>}
      </section>
      <section id="how-it-works" className="landing-section story-section">
        <div className="landing-heading"><div><span className="eyebrow">CHOOSE A ROLE</span><h2>How will you use ProximaFMS?</h2></div></div>
        <div className="story-switch" aria-label="Explore roles">{stories.map((item,index)=>{const TabIcon=item.icon;return <button key={item.role} aria-pressed={story===index} onClick={()=>setStory(index)}><TabIcon size={18}/>{item.label}</button>})}</div>
        <div className="story-panel" aria-live="polite"><span className="story-icon"><Icon size={33}/></span><div><h3>{active.title}</h3><p>{active.detail}</p></div><button className="button primary" onClick={()=>enter(active.role,active.page)}>{active.cta}<ArrowRight size={16}/></button></div>
      </section>
      <footer className="landing-footer"><span>ProximaFMS · Client demo · Sample listings and illustrative photos</span><button className="link" onClick={()=>enter('Admin')}><ShieldCheck size={16}/> Open admin workspace</button></footer>
    </main>
  </div>
}
