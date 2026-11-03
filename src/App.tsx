import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Bell, Building2, Check, ClipboardList, FileText, Home, LayoutDashboard, Moon, Plus, RotateCcw, Search, ShieldCheck, Sun, TriangleAlert, Wallet, Wrench, X } from 'lucide-react'
import { initial, navigation, pageBlurb, people } from './data'
import type { Role, State } from './data'
import type { Ctx, Modal } from './ctx'
import { value } from './ctx'
import Landing from './Landing'
import { addListing, Page, reportIssue } from './pages'
import { CommandPalette } from './ui'
import type { Command } from './ui'

const storageKey = 'proxima-fms-v2'
const themeKey = 'proxima-theme'
const roles = Object.keys(people) as Role[]
const navIcon = (name:string) => name==='Overview'?LayoutDashboard:/rental|Properties/.test(name)?Building2:/Rent |Earnings/.test(name)?Wallet:/Maintenance|work|marketplace/.test(name)?Wrench:/Verification|moderation|Disputes/.test(name)?ShieldCheck:/Applications/.test(name)?ClipboardList:FileText

function readState(): State {
  try { return { ...initial, ...JSON.parse(localStorage.getItem(storageKey) || 'null') } } catch { return initial }
}
function readTheme(): 'light'|'dark' {
  try { const saved = localStorage.getItem(themeKey); if (saved==='light'||saved==='dark') return saved } catch { /* fall through */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [state,setState] = useState(readState)
  const [theme,setTheme] = useState(readTheme)
  const [role,setRole] = useState<Role>('Tenant')
  const [landing,setLanding] = useState(true)
  const [page,setPage] = useState('Overview')
  const [seed,setSeed] = useState('')
  const [modal,setModal] = useState<Modal|null>(null)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const [notice,setNotice] = useState('')
  const [cmd,setCmd] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(themeKey,theme) } catch { /* theme still applies */ }
  },[theme])
  useEffect(() => {
    try { localStorage.setItem(storageKey,JSON.stringify(state)) } catch { setNotice('Browser storage is unavailable. Changes last for this session.') }
  },[state])
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal()
    if (!modal && dialog.current?.open) dialog.current.close()
  },[modal])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''),4200)
    return () => window.clearTimeout(timer)
  },[notice])
  useEffect(() => {
    const onKey = (event:KeyboardEvent) => { if ((event.metaKey||event.ctrlKey) && event.key.toLowerCase()==='k' && !landing) {event.preventDefault();setCmd(v=>!v)} }
    window.addEventListener('keydown',onKey)
    return () => window.removeEventListener('keydown',onKey)
  },[landing])

  const navigate = (next:string) => {setPage(next);setSeed('');window.scrollTo({top:0})}
  const enter = (nextRole:Role,nextPage='Overview',query='') => {setRole(nextRole);setLanding(false);setPage(nextPage);setSeed(query);window.scrollTo({top:0})}
  const open = (next:Modal) => {setError('');setModal(next)}
  const ctx: Ctx = {
    state, setState, role, page, seed, navigate, open,
    confirm:(title,detail,submit,run) => open({title,detail,submit,run}),
    notify:setNotice,
  }
  const themeToggle = <button className="icon-btn" aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    if (modal?.fields?.some(f=>f.type!=='file'&&!value(data,f.name))) {setError('Please complete all required fields.');return}
    const current = modal
    setBusy(true);setError('')
    try { await current?.run?.(data); setModal(m=>m===current?null:m) }
    catch (err) { setError(err instanceof Error?err.message:'Something went wrong. Please try again.') }
    finally { setBusy(false) }
  }

  const commands: Command[] = [
    ...navigation[role].map(name=>({label:name,hint:'Go to page',run:()=>navigate(name)})),
    ...roles.filter(r=>r!==role).map(r=>({label:'Switch to '+r,hint:people[r],run:()=>enter(r)})),
    {label:'Back to public site',hint:'Landing page',run:()=>{setLanding(true);window.scrollTo({top:0})}},
  ]
  const headerAction = page==='Properties'?<button className="btn primary" onClick={()=>addListing(ctx)}><Plus size={17}/> New listing</button>:page==='Maintenance'&&role==='Tenant'?<button className="btn primary" onClick={()=>reportIssue(ctx)}><Plus size={17}/> Report issue</button>:null

  return <>
    {landing?<Landing listings={state.listings.filter(l=>l.status==='Published')} extras={themeToggle} enter={enter}/>:
    <div className="shell">
      <aside className="side">
        <button className="logo" onClick={()=>navigate('Overview')}><span><Home size={18}/></span>Proxima<b>FMS</b></button>
        <nav aria-label={role+' workspace'}>{navigation[role].map(name=>{const Icon=navIcon(name);return <button key={name} aria-current={page===name?'page':undefined} onClick={()=>navigate(name)}><Icon size={18}/>{name}</button>})}</nav>
        <div className="side-foot">
          <div className="me"><span className="avatar">{people[role].split(' ').map(n=>n[0]).join('')}</span><div><strong>{people[role]}</strong><small>{role}</small></div></div>
          <button className="reset" onClick={()=>ctx.confirm('Reset demo data','This restores the sample records in this browser.','Reset demo',()=>{setState(initial);setRole('Tenant');navigate('Overview');setNotice('Demo data restored.')})}><RotateCcw size={14}/> Reset demo data</button>
        </div>
      </aside>
      <div className="work">
        <header className="top">
          <button className="crumb" onClick={()=>{setLanding(true);window.scrollTo({top:0})}}><Home size={15}/> Home <span>/</span> <b>{page}</b></button>
          <div className="top-tools">
            <button className="cmd-btn" onClick={()=>setCmd(true)}><Search size={15}/> Search <kbd>⌘K</kbd></button>
            <span className="demo-pill"><i/> Demo</span>
            {themeToggle}
            <button className="icon-btn" aria-label="Notifications" onClick={()=>setNotice('You’re all caught up.')}><Bell size={18}/></button>
            <label className="role-pick"><span>Role</span><select aria-label="Switch role" value={role} onChange={e=>enter(e.target.value as Role)}>{roles.map(r=><option key={r}>{r}</option>)}</select></label>
          </div>
        </header>
        <main key={role+page}>
          {page!=='Overview'&&<div className="page-head"><div><span className="eyebrow">{role} workspace</span><h1>{page}</h1><p>{pageBlurb[page]}</p></div>{headerAction}</div>}
          <Page c={ctx}/>
          <footer className="app-foot">ProximaFMS <span>Client walkthrough · Sample data</span></footer>
        </main>
      </div>
    </div>}
    <dialog ref={dialog} className={modal?.wide?'wide':''} aria-labelledby="dialog-title" onCancel={e=>{e.preventDefault();if(!busy)setModal(null)}} onClick={e=>{if(e.target===dialog.current&&!busy)setModal(null)}}>
      {modal&&<form key={modal.title} onSubmit={submit}>
        <button type="button" className="close" aria-label="Close dialog" disabled={busy} onClick={()=>setModal(null)}><X size={20}/></button>
        <span className="eyebrow">ProximaFMS demo</span><h2 id="dialog-title">{modal.title}</h2><p>{modal.detail}</p>{modal.body}
        {modal.fields?.map(f=><label className="field" key={f.name}>{f.label}{f.options?<select name={f.name} required>{f.options.map(o=><option key={o}>{o}</option>)}</select>:f.type==='textarea'?<textarea name={f.name} required maxLength={500} rows={3}/>:<input name={f.name} type={f.type??'text'} required={f.type!=='file'} maxLength={100} min={1} max={100000000} step={1} accept={f.type==='file'?'image/jpeg,image/png,image/webp':undefined}/>}</label>)}
        {error&&<p className="error" role="alert"><TriangleAlert size={16}/> {error}</p>}
        <div className="dialog-actions"><button type="button" className="btn" disabled={busy} onClick={()=>setModal(null)}>{modal.submit?'Cancel':'Close'}</button>{modal.submit&&<button className="btn primary" disabled={busy}>{busy?'Saving…':modal.submit}</button>}</div>
      </form>}
    </dialog>
    {cmd&&<CommandPalette items={commands} onClose={()=>setCmd(false)}/>}
    <div className="live" aria-live="polite">{notice&&<div className="toast"><Check size={18}/>{notice}</div>}</div>
  </>
}
