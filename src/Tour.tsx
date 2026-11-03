import { useEffect, useLayoutEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play, X } from 'lucide-react'
import type { Role } from './data'

export type TourStep = { at:'landing'|Role; page?:string; target:string; title:string; text:string; tag:string }
export const tourSteps: TourStep[] = [
  { at:'landing', target:'[data-tour="search"]', tag:'Public site', title:'It starts with a search', text:'Tenants search by neighbourhood in English, Sinhala or Tamil, with live suggestions as they type.' },
  { at:'landing', target:'[data-tour="calc"]', tag:'Public site', title:'No surprise costs', text:'Deposit and advance are worked out before anyone applies. That builds trust from the first visit.' },
  { at:'Tenant', page:'Find a rental', target:'[data-tour="searchbar"]', tag:'Tenant', title:'Search like a booking site', text:'Filter by type, price and trust level. Verified owners and properties carry a trust badge.' },
  { at:'Tenant', page:'Find a rental', target:'[data-tour="cards"]', tag:'Tenant', title:'Shortlist, compare, map', text:'Save homes with the heart, compare up to four side by side, or switch to the map view.' },
  { at:'Tenant', page:'Overview', target:'[data-tour="journey"]', tag:'Tenant', title:'The whole tenancy, one timeline', text:'From advert to deposit refund, every step is tracked so the tenant always knows what’s next.' },
  { at:'Tenant', page:'Rent & receipts', target:'[data-tour="invoice"]', tag:'Tenant', title:'Pay rent in seconds', text:'LANKAQR, card or bank transfer, with an instant receipt. Try “Pay now” after the tour.' },
  { at:'Investor', page:'Overview', target:'[data-tour="kpis"]', tag:'Investor', title:'A live portfolio', text:'Owners see rent collected, arrears, ad performance and repairs at a glance.' },
  { at:'Investor', page:'Overview', target:'[data-tour="apps"]', tag:'Investor', title:'Approve, reserve, sign', text:'Compare applicants, approve one, and move to a bilingual e-signed agreement with a sealed certificate.' },
  { at:'Craftsman', page:'Overview', target:'[data-tour="jobs"]', tag:'Craftsman', title:'Repairs become paid jobs', text:'Tenant reports turn into service jobs. Craftsmen quote, fix, and get paid once the work is approved.' },
  { at:'Admin', page:'Overview', target:'[data-tour="queues"]', tag:'Admin', title:'Trust and safety, measured', text:'Verification, moderation and disputes run on queues with SLA timers and a full audit trail.' },
]

type Rect = { top:number; left:number; width:number; height:number }
export function Tour({index,setIndex,onClose}:{index:number; setIndex:(i:number)=>void; onClose:()=>void}) {
  const step = tourSteps[index]
  const [rect,setRect] = useState<Rect|null>(null)
  const [auto,setAuto] = useState(false)
  useLayoutEffect(()=>{
    let frame = 0, tries = 0, settle = 0
    setRect(null)
    const measure = () => {
      const el = document.querySelector(step.target)
      if (!el) {if (tries++<90) frame = requestAnimationFrame(measure);return}
      el.scrollIntoView({block:'center',behavior:'smooth'})
      settle = window.setTimeout(()=>{const r=el.getBoundingClientRect();setRect({top:r.top,left:r.left,width:r.width,height:r.height})},520)
    }
    frame = requestAnimationFrame(measure)
    const update = () => {const el=document.querySelector(step.target);if(el){const r=el.getBoundingClientRect();setRect({top:r.top,left:r.left,width:r.width,height:r.height})}}
    window.addEventListener('resize',update);window.addEventListener('scroll',update,true)
    return () => {cancelAnimationFrame(frame);window.clearTimeout(settle);window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true)}
  },[index,step.target])
  useEffect(()=>{
    const onKey = (e:KeyboardEvent) => {if(e.key==='Escape')onClose();if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft'&&index>0)setIndex(index-1)}
    window.addEventListener('keydown',onKey)
    return () => window.removeEventListener('keydown',onKey)
  })
  useEffect(()=>{
    if (!auto) return
    const t = window.setTimeout(()=>{index<tourSteps.length-1?setIndex(index+1):setAuto(false)},5200)
    return () => window.clearTimeout(t)
  },[auto,index,setIndex])
  const next = () => index<tourSteps.length-1?setIndex(index+1):onClose()
  const pad = 10
  const vw = typeof window==='undefined'?1200:window.innerWidth, vh = typeof window==='undefined'?800:window.innerHeight
  const cardW = Math.min(380,vw-24)
  let pos: {top:number; left:number} = {top:vh/2-110,left:vw/2-cardW/2}
  if (rect) {
    const below = rect.top+rect.height+pad+16, above = rect.top-pad-16-230
    const top = below+230<vh ? below : above>12 ? above : Math.max(12,vh-250)
    pos = {top,left:Math.min(Math.max(12,rect.left),vw-cardW-12)}
  }
  return <div className="tour" role="dialog" aria-modal="true" aria-label="Guided tour">
    {rect?<div className="tour-spot" style={{top:rect.top-pad,left:rect.left-pad,width:rect.width+pad*2,height:rect.height+pad*2}}/>:<div className="tour-dim"/>}
    <div className="tour-card" style={{top:pos.top,left:pos.left,width:cardW}} key={index}>
      <div className="tour-top"><span className="tour-tag">{step.tag}</span><span className="muted">{index+1} / {tourSteps.length}</span><button className="tour-x" aria-label="End tour" onClick={onClose}><X size={16}/></button></div>
      <h3>{step.title}</h3><p>{step.text}</p>
      <div className="tour-prog" aria-hidden="true">{tourSteps.map((_,i)=><i key={i} className={i<=index?'on':''}/>)}</div>
      <div className="tour-actions">
        <button className="icon-btn" aria-label={auto?'Pause autoplay':'Autoplay tour'} onClick={()=>setAuto(a=>!a)}>{auto?<Pause size={16}/>:<Play size={16}/>}</button>
        <span className="grow"/>
        {index>0&&<button className="btn" onClick={()=>setIndex(index-1)}><ArrowLeft size={15}/> Back</button>}
        <button className="btn primary" onClick={next}>{index<tourSteps.length-1?<>Next <ArrowRight size={15}/></>:'Start exploring'}</button>
      </div>
    </div>
  </div>
}
