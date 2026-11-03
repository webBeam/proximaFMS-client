import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { BadgeCheck, Bookmark, Check, ClipboardList, KeyRound, Megaphone, PenLine, RefreshCw, Search, ShieldCheck, Wallet, Wrench } from 'lucide-react'
import { photoFor } from './data'

export function Photo({kind,id,eager=false}:{kind:string; id?:string; eager?:boolean}) {
  return <img className="photo" src={photoFor(kind,id)} alt={kind==='Apartment'?'Apartment building with balconies':kind==='Boarding unit'?'Residential building beside palms':'Modern tropical house'} loading={eager?'eager':'lazy'} decoding="async"/>
}

export function Badge({status}:{status:string}) {
  const tone = /Published|Paid|Approved|Verified|Resolved|Active|Completed/.test(status) ? 'good' : /Declined|Rejected|Overdue|Due/.test(status) ? 'bad' : 'wait'
  return <span className={'badge '+tone}><i/>{status}</span>
}

export function TrustBadge({level}:{level:'L2'|'L3'}) {
  return <span className={'trust-badge '+level}><BadgeCheck size={14}/>{level==='L3'?'Verified property':'Verified owner'}</span>
}

export function Empty({text}:{text:string}) {
  return <div className="empty"><ClipboardList size={26}/><p>{text}</p></div>
}

export const journeySteps = [
  { title:'Advertise', detail:'Owner lists, platform verifies', icon:Megaphone },
  { title:'Discover', detail:'Search, compare, view', icon:Search },
  { title:'Reserve', detail:'Apply, approve, hold unit', icon:Bookmark },
  { title:'Sign', detail:'Review and e-sign online', icon:PenLine },
  { title:'Pay rent', detail:'Invoices, reminders, receipts', icon:Wallet },
  { title:'Repair', detail:'Report, quote, fix, pay', icon:Wrench },
  { title:'Renew or exit', detail:'Inspect, settle deposit', icon:RefreshCw },
]
export function Journey({current,compact=false,selected,onSelect}:{current:number; compact?:boolean; selected?:number; onSelect?:(index:number)=>void}) {
  return <ol className={'journey'+(compact?' compact':'')+(onSelect?' pick':'')} aria-label="Tenancy lifecycle">{journeySteps.map((step,index)=>{
    const Icon = step.icon
    const state = index<current?'done':index===current?'now':'next'
    const inner = <><span className="j-dot">{state==='done'?<Check size={16}/>:<Icon size={16}/>}</span><b>{step.title}</b>{!compact&&<small>{step.detail}</small>}</>
    return <li key={step.title} className={state+(selected===index?' sel':'')} aria-current={state==='now'?'step':undefined}>{onSelect?<button type="button" aria-pressed={selected===index} onClick={()=>onSelect(index)}>{inner}</button>:inner}</li>
  })}</ol>
}

const appStages = ['Submitted','Approved','Reserved','Awaiting tenant signature','Awaiting investor signature','Active']
const appLabels = ['Applied','Approved','Reserved','Tenant signs','Owner signs','Active']
export function AppSteps({status}:{status:string}) {
  if (status==='Declined') return <div className="app-steps declined">This application was declined.</div>
  const at = Math.max(0,appStages.indexOf(status))
  return <ol className="app-steps" aria-label="Application progress">{appLabels.map((label,index)=><li key={label} className={index<at?'done':index===at?'now':''}><i>{index<at?<Check size={12}/>:index+1}</i>{label}</li>)}</ol>
}

export function Sparkline({values}:{values:number[]}) {
  const max = Math.max(...values), min = Math.min(...values)
  const points = values.map((value,index)=>`${(index/(values.length-1))*100},${27-((value-min)/(max-min||1))*24}`).join(' ')
  return <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/></svg>
}

export function Donut({value,label}:{value:number; label:string}) {
  const radius = 44, circumference = 2*Math.PI*radius
  return <figure className="donut"><svg viewBox="0 0 120 120" role="img" aria-label={label+' '+value+' percent'}><circle className="d-track" cx="60" cy="60" r={radius}/><circle className="d-val" cx="60" cy="60" r={radius} strokeDasharray={`${circumference*value/100} ${circumference}`} style={{['--len' as string]:`${circumference*value/100} ${circumference}`}} transform="rotate(-90 60 60)"/></svg><figcaption><strong>{value}%</strong><span>{label}</span></figcaption></figure>
}

export function Columns({data,format}:{data:{label:string; value:number}[]; format:(value:number)=>string}) {
  const max = Math.max(...data.map(item=>item.value))
  return <div className="columns" role="img" aria-label="Monthly rent collected">{data.map((item,index)=><div key={item.label} className={index===data.length-1?'col now':'col'}><span className="col-val">{format(item.value)}</span><i style={{height:Math.max(8,item.value/max*100)+'%'}}/><b>{item.label}</b></div>)}</div>
}

export function HBars({data}:{data:{label:string; value:number}[]}) {
  const max = Math.max(...data.map(item=>item.value))
  return <ul className="hbars">{data.map(item=><li key={item.label}><span>{item.label}</span><div><i style={{width:item.value/max*100+'%'}}/></div><b>{item.value.toLocaleString('en-LK')}</b></li>)}</ul>
}

export function TrustMeter({level}:{level:1|2|3}) {
  const levels = [['L1','Contact verified','Can draft'],['L2','Identity verified','Can publish ads'],['L3','Property verified','Can sign leases and get paid']]
  return <ol className="trust-meter" aria-label="Investor trust level">{levels.map(([code,title,detail],index)=><li key={code} className={index+1<level?'done':index+1===level?'now':''}><span>{index+1<=level?<ShieldCheck size={16}/>:<KeyRound size={16}/>}</span><div><b>{code} · {title}</b><small>{detail}</small></div></li>)}</ol>
}

export function Kpi({label,value,count,format,hint,tone,children}:{label:string; value?:ReactNode; count?:number; format?:(n:number)=>string; hint?:string; tone:'mint'|'lime'|'sun'|'coral'; children?:ReactNode}) {
  return <article className={'kpi '+tone}><span>{label}</span><strong>{count===undefined?value:<CountUp to={count} format={format}/>}</strong>{children}{hint&&<small>{hint}</small>}</article>
}

export type Command = { label:string; hint:string; run:()=>void }
export function CommandPalette({items,onClose}:{items:Command[]; onClose:()=>void}) {
  const [text,setText] = useState('')
  const [index,setIndex] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  useEffect(()=>{input.current?.focus()},[])
  const shown = items.filter(item=>(item.label+' '+item.hint).toLowerCase().includes(text.trim().toLowerCase()))
  const run = (item?:Command) => {if(item){onClose();item.run()}}
  return <div className="cmd-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <div className="cmd" role="dialog" aria-modal="true" aria-label="Quick search">
      <div className="cmd-input"><Search size={18}/><input ref={input} value={text} placeholder="Jump to a page or switch role…" aria-label="Quick search" onChange={event=>{setText(event.target.value);setIndex(0)}} onKeyDown={event=>{
        if(event.key==='Escape')onClose()
        else if(event.key==='ArrowDown'){event.preventDefault();setIndex(value=>Math.min(value+1,shown.length-1))}
        else if(event.key==='ArrowUp'){event.preventDefault();setIndex(value=>Math.max(value-1,0))}
        else if(event.key==='Enter')run(shown[index])
      }}/><kbd>esc</kbd></div>
      <ul>{shown.map((item,position)=><li key={item.label+item.hint}><button className={position===index?'active':''} onMouseEnter={()=>setIndex(position)} onClick={()=>run(item)}><b>{item.label}</b><small>{item.hint}</small></button></li>)}{!shown.length&&<li className="cmd-empty">Nothing matches “{text}”.</li>}</ul>
    </div>
  </div>
}

const reduced = () => typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches
export function CountUp({to,format,duration=1200}:{to:number; format?:(n:number)=>string; duration?:number}) {
  const [shown,setShown] = useState(reduced()?to:0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(()=>{
    if (reduced()) {setShown(to);return}
    let frame = 0
    const run = () => {
      const start = performance.now()
      const tick = (now:number) => {
        const t = Math.min(1,(now-start)/duration)
        setShown(Math.round(to*(1-Math.pow(1-t,3))))
        if (t<1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }
    const settle = window.setTimeout(()=>setShown(to),duration+1800)
    if (!('IntersectionObserver' in window)||!ref.current) {run();return () => {window.clearTimeout(settle);cancelAnimationFrame(frame)}}
    const io = new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();run()}},{threshold:.4})
    io.observe(ref.current)
    return () => {io.disconnect();window.clearTimeout(settle);cancelAnimationFrame(frame)}
  },[to,duration])
  return <span ref={ref}>{format?format(shown):shown.toLocaleString('en-LK')}</span>
}

export function celebrate() {
  if (reduced()) return
  const layer = document.createElement('div')
  layer.className = 'confetti'
  const colors = ['#cdf56e','#0a8f5b','#ffd166','#ff8a6b','#7ad7f0','#ffffff']
  for (let i=0;i<70;i++) {
    const piece = document.createElement('i')
    piece.style.left = Math.random()*100+'%'
    piece.style.background = colors[i%colors.length]
    piece.style.setProperty('--dx',(Math.random()*240-120)+'px')
    piece.style.setProperty('--rot',(Math.random()*720-360)+'deg')
    piece.style.animationDelay = Math.random()*0.25+'s'
    piece.style.animationDuration = 1.3+Math.random()*0.9+'s'
    layer.appendChild(piece)
  }
  ;(document.querySelector('dialog[open]') ?? document.body).appendChild(layer)
  window.setTimeout(()=>layer.remove(),2600)
}

export function useReveal() {
  useEffect(()=>{
    const nodes = Array.from(document.querySelectorAll('.reveal'))
    if (reduced()||!('IntersectionObserver' in window)) {nodes.forEach(n=>n.classList.add('in'));return}
    const io = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15,rootMargin:'0px 0px -40px 0px'})
    nodes.forEach(n=>io.observe(n))
    return () => io.disconnect()
  },[])
}

export const tilt = {
  onPointerMove(e:ReactPointerEvent<HTMLElement>) {
    if (e.pointerType!=='mouse'||reduced()) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/r.height-.5
    e.currentTarget.style.setProperty('--rx',(-y*7).toFixed(2)+'deg')
    e.currentTarget.style.setProperty('--ry',(x*9).toFixed(2)+'deg')
    e.currentTarget.style.setProperty('--gx',((x+.5)*100).toFixed(1)+'%')
    e.currentTarget.style.setProperty('--gy',((y+.5)*100).toFixed(1)+'%')
  },
  onPointerLeave(e:ReactPointerEvent<HTMLElement>) {
    e.currentTarget.style.setProperty('--rx','0deg');e.currentTarget.style.setProperty('--ry','0deg')
  },
}
