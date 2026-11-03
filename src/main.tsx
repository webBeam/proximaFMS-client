import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDownRight, ArrowRight, Building2, Check, ChevronDown, ClipboardList, FileText, Home, LayoutDashboard, MapPin, Palette, Plus, Search, ShieldCheck, Wallet, Wrench, X, TriangleAlert, RotateCcw } from 'lucide-react'
import { initial, money, navigation, people, uid } from './data'
import type { Application, Listing, Repair, Role, State } from './data'
import '@fontsource-variable/manrope/wght.css'
import '@fontsource-variable/space-grotesk/wght.css'
import './style.css'
import Landing from './Landing'
import './workspace.css'
import PropertyPhoto from './PropertyPhoto'

const roles = Object.keys(people) as Role[]
const navIcon = (name:string) => name === 'Overview' ? LayoutDashboard : /rental|Properties/.test(name) ? Building2 : /Rent |Earnings/.test(name) ? Wallet : /Maintenance|work|marketplace/.test(name) ? Wrench : /Verification|moderation|Disputes/.test(name) ? ShieldCheck : /Applications/.test(name) ? ClipboardList : FileText
const storageKey = 'proxima-fms-demo-v1'
const themeKey = 'proxima-fms-palette'
const palettes = [
  { id:'courtyard', name:'Market Day', colors:['#172e5d','#fdcf50','#ff7f68'] },
  { id:'terrace', name:'Papaya', colors:['#451f41','#f89171','#f8d855'] },
  { id:'harbour', name:'Lagoon', colors:['#123945','#25c6a1','#ffbf57'] },
]
function readPalette() {
  try { return palettes.find(palette => palette.id === localStorage.getItem(themeKey)) ?? palettes[0] }
  catch { return palettes[0] }
}
function readState(): State {
  try { return JSON.parse(localStorage.getItem(storageKey) || 'null') ?? initial } catch { return initial }
}
type Field = {name:string; label:string; type?:string; options?:string[]}
type Modal = {title:string; detail:string; submit?:string; fields?:Field[]; run?:(data:FormData)=>void|Promise<void>}
const value = (form:FormData,key:string) => String(form.get(key) ?? '').trim()
async function photo(form:FormData,key:string): Promise<string|undefined> {
  const file = form.get(key)
  if (!(file instanceof File) || !file.size) return
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 750000) throw new Error('Choose a JPG, PNG or WebP image under 750 KB.')
  return new Promise((resolve,reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The selected image could not be read.'))
    reader.readAsDataURL(file)
  })
}
function Badge({status}:{status:string}) {
  const type = /Published|Paid|Approved|Verified|Resolved|Active|Completed|Available/.test(status) ? 'good' : /Declined|Rejected|Overdue/.test(status) ? 'bad' : 'wait'
  return <span className={'badge '+type}><i/>{status}</span>
}
function App() {
  const [state,setState] = useState(readState)
  const [palette,setPalette] = useState(readPalette)
  useLayoutEffect(() => {
    document.documentElement.dataset.palette = palette.id
    try { localStorage.setItem(themeKey,palette.id) } catch { /* The palette still applies in this session. */ }
  },[palette])
  const [role,setRole] = useState<Role>('Tenant')
  const [landing,setLanding] = useState(true)
  const [page,setPage] = useState('Overview')
  const [query,setQuery] = useState('')
  const [kind,setKind] = useState('')
  const [sort,setSort] = useState('featured')
  const [propertyId,setPropertyId] = useState<string|null>(null)
  const [modal,setModal] = useState<Modal|null>(null)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const [notice,setNotice] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    try { localStorage.setItem(storageKey,JSON.stringify(state)) }
    catch { setNotice('Changes are available for this session. Browser storage is full or unavailable.') }
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
  const navigate = (next:string) => {setPage(next);setQuery('');setKind('');setSort('featured');setPropertyId(null);window.scrollTo({top:0,behavior:'instant'})}
  const enter = (nextRole:Role,nextPage='Overview',search='') => {
    setRole(nextRole);setLanding(false);navigate(nextPage);setQuery(search)
  }
  const goHome = () => {setLanding(true);window.scrollTo({top:0,behavior:'instant'})}
  const open = (next:Modal) => {setError('');setModal(next)}
  const notify = (message:string) => setNotice(message)
  const patchListing = (id:string,status:string) => setState(s=>({...s,listings:s.listings.map(item=>item.id===id?{...item,status}:item)}))
  const patchApp = (id:string,status:string) => setState(s=>({...s,applications:s.applications.map(item=>item.id===id?{...item,status}:item)}))
  const patchRepair = (id:string,patch:Partial<Repair>) => setState(s=>({...s,repairs:s.repairs.map(item=>item.id===id?{...item,...patch}:item)}))
  const confirm = (title:string,detail:string,submit:string,run:()=>void) => open({title,detail,submit,run})
  const action = (label:string,fn:()=>void,primary=false) => <button className={primary?'button primary':'button'} onClick={fn}>{label}</button>
  const row = (id:string,title:string,detail:string,status:string,buttons?:ReactNode,attachment?:string) =>
    <article className="record" key={id}><div className="record-icon">{attachment?<img src={attachment} alt="Attached repair evidence"/>:<FileText size={19}/>}</div><div className="record-text"><small>{id}</small><h3>{title}</h3><p>{detail}</p></div><Badge status={status}/>{buttons&&<div className="record-actions">{buttons}</div>}</article>
  const empty = (message:string) => <div className="empty"><ClipboardList size={25}/><h3>{message}</h3></div>

  function addListing() {
    open({title:'Create rental listing',detail:'Submit a property or unit for moderation. It will appear in tenant search after approval.',submit:'Submit for review',fields:[
      {name:'title',label:'Property or unit name'},{name:'location',label:'Location'},{name:'kind',label:'Property type',options:['Apartment','Boarding unit','House']},{name:'rent',label:'Monthly rent (LKR)',type:'number'},
    ],run:form=>{
      const listing = {id:uid('PF'),title:value(form,'title'),location:value(form,'location'),kind:value(form,'kind'),rent:Number(value(form,'rent')),status:'Pending review',tone:1}
      setState(s=>({...s,listings:[listing,...s.listings]}));notify('Listing submitted for moderation.')
    }})
  }
  function apply(listing:Listing) {
    open({title:'Apply for '+listing.title,detail:money(listing.rent)+' per month · '+listing.location,submit:'Send application',fields:[{name:'note',label:'Household details and preferred move-in date',type:'textarea'}],run:form=>{
      setState(s=>({...s,applications:[{id:uid('APP'),listingId:listing.id,note:value(form,'note'),status:'Submitted'},...s.applications]}))
      notify('Application sent to the investor.')
    }})
  }
  function reportIssue() {
    open({title:'Report a maintenance issue',detail:'Your investor will review this request for Cinnamon Court, Unit 2B.',submit:'Send request',fields:[
      {name:'title',label:'Issue title'},{name:'category',label:'Category',options:['Plumbing','Electrical','Painting','General repairs']},
      {name:'note',label:'Describe the issue',type:'textarea'},{name:'photo',label:'Photo evidence (optional)',type:'file'},
    ],run:async form=>{
      const attachment = await photo(form,'photo')
      setState(s=>({...s,repairs:[{id:uid('MNT'),title:value(form,'title'),category:value(form,'category'),note:value(form,'note'),photo:attachment,status:'Reported'},...s.repairs]}))
      notify('Maintenance request sent.')
    }})
  }
  function applicationButtons(item:Application) {
    const transition = (label:string,next:string,detail:string,primary=true) => action(label,()=>confirm(label,detail,label,()=>{
      patchApp(item.id,next);notify('Application updated to '+next.toLowerCase()+'.')
    }),primary)
    if (role==='Investor' && item.status==='Submitted') return <>{transition('Decline','Declined','This closes the demo application.',false)}{transition('Approve','Approved','The tenant can reserve the unit after approval.')}</>
    if (role==='Tenant' && item.status==='Approved') return transition('Reserve unit','Reserved','Simulate a holding payment and reserve the unit.')
    if (role==='Investor' && item.status==='Reserved') return transition('Send agreement','Awaiting tenant signature','Send the tenant a sample 12-month agreement.')
    if (role==='Tenant' && item.status==='Awaiting tenant signature') return transition('Sign demo agreement','Awaiting investor signature','Sample terms · 12 months from 1 December 2026. Rent is due on the first day of each month. This signature is simulated.')
    if (role==='Investor' && item.status==='Awaiting investor signature') return transition('Countersign','Active','Simulate the investor signature and activate this demo tenancy.')
  }
  function repairButtons(item:Repair) {
    const move = (label:string,status:string,detail:string) => action(label,()=>confirm(label,detail,label,()=>{patchRepair(item.id,{status});notify('Job updated to '+status.toLowerCase()+'.')}),true)
    if (role==='Investor' && item.status==='Reported') return move('Publish service job','Open for quotes','Publish the issue to the craftsman marketplace.')
    if (role==='Craftsman' && item.status==='Open for quotes') return action('Send quote',()=>open({title:'Quote for '+item.title,detail:'Enter the total cost for labour and materials.',submit:'Send quote',fields:[{name:'amount',label:'Quote total (LKR)',type:'number'}],run:form=>{patchRepair(item.id,{status:'Quote submitted',quote:Number(value(form,'amount'))});notify('Quote sent to the investor.')}}),true)
    if (role==='Investor' && item.status==='Quote submitted') return move('Award & fund job','Awarded','Award this job to Kasun Silva and simulate funding '+money(item.quote??0)+'.')
    if (role==='Craftsman' && item.status==='Awarded') return move('Start work','In progress','Mark the service job as in progress.')
    if (role==='Craftsman' && item.status==='In progress') return action('Submit completion',()=>open({title:'Submit completion',detail:'Send the completed job to the tenant for confirmation.',submit:'Submit completion',fields:[{name:'proof',label:'Completion photo (optional)',type:'file'}],run:async form=>{patchRepair(item.id,{status:'Awaiting tenant confirmation',proof:await photo(form,'proof')});notify('Completion sent for confirmation.')}}),true)
    if (role==='Tenant' && item.status==='Awaiting tenant confirmation') return move('Confirm repair','Awaiting payout approval','Confirm that the maintenance issue has been resolved.')
    if (role==='Investor' && item.status==='Awaiting payout approval') return move('Approve demo payout','Completed','Simulate releasing '+money(item.quote??0)+' to the craftsman.')
  }
  const published = state.listings.filter(item=>item.status==='Published')
  const completed = state.repairs.filter(item=>item.status==='Completed')
  const pendingReviews = state.reviews.filter(item=>item.status==='Pending').length
  const pendingListings = state.listings.filter(item=>item.status==='Pending review').length
  const disputes = state.reviews.filter(item=>item.kind==='Dispute' && item.status==='Open').length
  const adminStats = [
    ['Verification queue',pendingReviews,'Verification'],
    ['Listings to moderate',pendingListings,'Listing moderation'],
    ['Open disputes',disputes,'Disputes'],
  ] as const
  const descriptions: Record<string,string> = {
    'Find a rental':'Browse apartments, houses and boarding units across Colombo.',
    Properties:'Manage your property and unit advertisements.',
    Applications:role==='Tenant'?'Track your rental applications and reservations.':'Review applicants and manage reservations.',
    'My tenancy':'Review your current tenancy and any agreements awaiting signature.',
    Agreements:'Send and countersign sample tenancy agreements.',
    'Rent & receipts':'View your rent invoice and simulate an online payment.',
    'Rent ledger':'Track the sample invoice and its payment status.',
    Maintenance:role==='Tenant'?'Report issues and follow repairs through to completion.':'Review tenant requests, award jobs and approve payouts.',
    'Job marketplace':'Find service jobs and send quotes to property owners.',
    'My work':'Track quotes, manage awarded work and submit completion evidence.',
    Earnings:'See simulated payouts for completed service jobs.',
    Verification:'Review sample investor and craftsman verification cases.',
    'Listing moderation':'Review submitted listings before they appear in rental search.',
    Disputes:'Review cases and record the outcome of a demo dispute.',
    Reports:'See a live summary of activity in the demo workspace.',
  }
  function listingsPage() {
    const list = (role==='Tenant'?published:state.listings).filter(item=>(!kind||item.kind===kind)&&[item.title,item.location,item.kind].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
    const featured = list.find(item=>item.id===propertyId)
    if (featured) {
      const applied = state.applications.some(app=>app.listingId===featured.id&&app.status!=='Declined')
      return <section className="listing-detail">
        <button className="link" onClick={()=>setPropertyId(null)}>← Back to results</button>
        <div className="listing-detail-photo"><PropertyPhoto kind={featured.kind} eager/></div>
        <div className="listing-detail-copy"><span className="eyebrow">{featured.kind} · SAMPLE LISTING</span><h2>{featured.title}</h2><p><MapPin size={16}/> {featured.location}</p>
          <dl><div><dt>Monthly rent</dt><dd>{money(featured.rent)}</dd></div><div><dt>Illustrative move-in cost</dt><dd>{money(featured.rent*2)}</dd></div></dl>
          <p>Move-in estimate includes one month’s rent and one month’s deposit.</p>
          {applied?action('Track your application',()=>navigate('Applications')):action('Start application',()=>apply(featured),true)}
        </div>
      </section>
    }
    if (sort!=='featured') list.sort((a,b)=>sort==='low'?a.rent-b.rent:b.rent-a.rent)
    return <><div className="filters directory-filters">
      <label><span>Property or neighbourhood</span><span className="search"><Search size={18}/><input aria-label="Search listings" placeholder="Try Rajagiriya" value={query} onChange={e=>setQuery(e.target.value)}/></span></label>
      <label><span>Property type</span><select value={kind} onChange={e=>setKind(e.target.value)}><option value="">All property types</option>{['Apartment','Boarding unit','House'].map(item=><option key={item}>{item}</option>)}</select></label>
      <label><span>Sort by</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Rent: low to high</option><option value="high">Rent: high to low</option></select></label>
      {(query||kind||sort!=='featured')&&action('Clear filters',()=>{setQuery('');setKind('');setSort('featured')})}
    </div>
    <p className="count">{list.length} {list.length===1?'property':'properties'}</p>
    {list.length===0?empty('No properties match your search.'): <div className="property-grid">{list.map(item=>{
      return <article className="property" key={item.id}><div className="property-art"><PropertyPhoto kind={item.kind}/><span>{item.kind}</span></div><div className="property-body"><h3>{item.title}</h3><p><MapPin size={14}/>{item.location}</p><strong>{money(item.rent)} <small>/ month</small></strong><div className="property-foot">{role==='Tenant'?action('View property',()=>{setPropertyId(item.id);window.scrollTo({top:0,behavior:'instant'})},true):<><Badge status={item.status}/>{item.status==='Published'&&action('Pause',()=>{patchListing(item.id,'Paused');notify('Listing paused.')})}{/Paused|Rejected/.test(item.status)&&action('Resubmit',()=>{patchListing(item.id,'Pending review');notify('Listing sent for moderation.')})}</>}</div></div></article>
    })}</div>}</>
  }
  function content() {
    if (page==='Overview') {
      if (role==='Tenant') {
        const latest = state.repairs[0]
        return <><section className="hero"><div className="hero-copy"><span className="eyebrow">YOUR TENANT SPACE</span><h1>Make yourself at home.</h1><p>Welcome, Anjali. Find your next home or take care of the one you’re in.</p><button className="button primary" onClick={()=>navigate('Find a rental')}>Explore rentals <ArrowRight size={16}/></button></div><PropertyPhoto kind="hero" eager/></section>
        <div className="section-heading"><h2>At home in Cinnamon Court</h2><span>Unit 2B</span></div>
        <div className="resident-grid"><article className="next"><span className="stat-icon"><Wallet size={18}/></span><h3>{state.paid?'November rent paid':'November rent is due'}</h3><p>{money(85000)} · 5 November</p>{action(state.paid?'Open rent receipt':'View rent invoice',()=>navigate('Rent & receipts'),true)}</article>
        <article className="next warm"><span className="stat-icon"><Wrench size={18}/></span><h3>Need a repair?</h3><p>Add a description and a photo for your investor.</p>{action('Report an issue',reportIssue,true)}</article>
        <article className="next"><span className="stat-icon"><ClipboardList size={18}/></span><h3>My applications</h3><p>{state.applications.length} in your activity</p>{action('Track applications',()=>navigate('Applications'))}</article></div>
        {latest&&<><div className="section-heading"><h2>Latest repair</h2><button className="link" onClick={()=>navigate('Maintenance')}>View all <ArrowRight size={16}/></button></div>{row(latest.id,latest.title,latest.note,latest.status,repairButtons(latest),latest.proof??latest.photo)}</>}</>
      }
      if (role==='Investor') {
        const queue = state.applications.filter(item=>item.status==='Submitted')
        const repairs = state.repairs.filter(item=>['Reported','Quote submitted','Awaiting payout approval'].includes(item.status))
        return <><section className="role-banner"><div><span className="eyebrow">INVESTOR PORTFOLIO</span><h1>Manage your rentals.</h1><p>Review applications and repairs that need your decision.</p></div><button className="button primary" onClick={addListing}><Plus size={17}/> New listing</button></section>
        <div className="investor-layout"><section><div className="section-heading"><h2>Applications to review</h2><button className="link" onClick={()=>navigate('Applications')}>View all</button></div><div className="records">{queue.length?queue.map(item=>row(item.id,state.listings.find(listing=>listing.id===item.listingId)?.title??'Rental application',item.note,item.status,applicationButtons(item))):empty('You’re caught up on applications.')}</div></section>
        <aside className="next portfolio-summary"><span className="eyebrow">PORTFOLIO SNAPSHOT</span><strong>{state.listings.length}</strong><h3>Property listings</h3><p>{published.length} published in the rental marketplace</p>{action('Manage properties',()=>navigate('Properties'))}{action('Open rent ledger',()=>navigate('Rent ledger'))}</aside></div>
        <div className="section-heading"><h2>Repairs that need attention</h2><button className="link" onClick={()=>navigate('Maintenance')}>View all</button></div><div className="records">{repairs.length?repairs.map(item=>row(item.id,item.title,item.category+' · '+item.note+(item.quote?' · '+money(item.quote):''),item.status,repairButtons(item),item.proof??item.photo)):empty('No repair decisions are pending.')}</div></>
      }
      if (role==='Craftsman') {
        const available = state.repairs.filter(item=>item.status==='Open for quotes')
        const assigned = state.repairs.filter(item=>!['Reported','Open for quotes','Completed'].includes(item.status))
        return <><section className="role-banner trade-banner"><div><span className="eyebrow">CRAFTSMAN WORKSPACE</span><h1>Find work. Get it done.</h1><p>Quote for jobs, share your progress and track demo payouts.</p></div>{action('View earnings',()=>navigate('Earnings'),true)}</section>
        <div className="section-heading"><h2>Open jobs</h2><button className="link" onClick={()=>navigate('Job marketplace')}>Open marketplace <ArrowRight size={16}/></button></div>
        {available.length?<div className="resident-grid">{available.map(item=><article key={item.id} className="next trade-card"><span className="eyebrow"><Wrench size={15}/> {item.category}</span><h3>{item.title}</h3><p>{item.note}</p>{repairButtons(item)}</article>)}</div>:empty('No jobs are open for quotes right now.')}
        <div className="section-heading"><h2>Work in your pipeline</h2><button className="link" onClick={()=>navigate('My work')}>Open my work</button></div><div className="records">{assigned.length?assigned.map(item=>row(item.id,item.title,item.category,item.status,repairButtons(item))):empty('Jobs will appear here after you send a quote.')}</div></>
      }
      return <><section className="role-banner"><div><span className="eyebrow">ADMIN OPERATIONS</span><h1>Review queues</h1><p>Manage verification, listing moderation and disputes.</p></div></section><div className="section-heading"><h2>Needs attention</h2></div><div className="stat-grid">{adminStats.map(([label,total,to])=>{const Icon=navIcon(to);return <button className="stat" key={label} onClick={()=>navigate(to)}><span className="stat-icon"><Icon size={19}/></span><ArrowDownRight className="stat-arrow" size={18}/><strong>{total}</strong><span>{label}</span></button>})}</div></>
    }
    if (page==='Find a rental'||page==='Properties') return listingsPage()
    if (['Applications','Agreements','My tenancy'].includes(page)) {
      const items = state.applications.filter(item=>page==='Applications'||!['Submitted','Declined','Approved'].includes(item.status))
      return <div className="records">{page==='My tenancy'&&row('LSE-082','Cinnamon Court · Unit 2B','Current tenancy · Sample lease · LKR 85,000 per month','Active')}{items.map(item=>row(item.id,state.listings.find(listing=>listing.id===item.listingId)?.title??'Rental application',item.note,item.status,applicationButtons(item)))}{!items.length&&page!=='My tenancy'&&empty('No records to show yet.')}</div>
    }
    if (page==='Rent & receipts'||page==='Rent ledger') return <div className="records">{row('INV-1103','November 2026 rent','Cinnamon Court, Unit 2B · Due 5 November · '+money(85000),state.paid?'Paid':'Due',
      role==='Tenant'?(state.paid?action('View receipt',()=>open({title:'Demo receipt · REC-1103',detail:'Anjali Fernando · November 2026 rent · '+money(85000)+' · Paid via simulated online payment.'})):action('Simulate payment',()=>confirm('Pay November rent',money(85000)+' · This demo does not collect payment details.','Confirm demo payment',()=>{setState(s=>({...s,paid:true}));notify('Demo payment recorded. Receipt is ready.')}),true)):undefined)}</div>
    if (['Maintenance','Job marketplace','My work','Earnings'].includes(page)) {
      const list = page==='Earnings'?completed:state.repairs.filter(item=>page==='Job marketplace'?item.status==='Open for quotes':page==='My work'?!['Reported','Open for quotes'].includes(item.status):true)
      return <div className="records">{list.map(item=>row(item.id,item.title,item.category+' · '+item.note+(item.quote?' · '+money(item.quote):''),item.status,repairButtons(item),item.proof??item.photo))}{!list.length&&empty(page==='Earnings'?'No payouts have been completed yet.':'No jobs to show here.')}</div>
    }
    if (page==='Listing moderation') {
      const queue = state.listings.filter(item=>item.status==='Pending review')
      return <div className="records">{queue.map(item=>row(item.id,item.title,item.kind+' · '+item.location+' · '+money(item.rent),item.status,<>{action('Reject',()=>confirm('Reject listing','The investor can resubmit the listing for review.','Reject listing',()=>{patchListing(item.id,'Rejected');notify('Listing rejected.')}))}{action('Approve & publish',()=>confirm('Publish listing','The listing will now appear in tenant search.','Approve & publish',()=>{patchListing(item.id,'Published');notify('Listing published.')}),true)}</>))}{!queue.length&&empty('You’re all caught up. No listings are awaiting review.')}</div>
    }
    if (page==='Verification'||page==='Disputes') return <div className="records">{state.reviews.filter(item=>item.kind===(page==='Verification'?'Verification':'Dispute')).map(item=>{
      const review = (label:string,status:string) => action(label,()=>open({title:label,detail:item.detail,submit:label,fields:[{name:'reason',label:'Decision note',type:'textarea'}],run:form=>{
        setState(s=>({...s,reviews:s.reviews.map(entry=>entry.id===item.id?{...entry,status,detail:entry.detail+' · Decision: '+value(form,'reason')}:entry)}));notify('Decision recorded.')
      }}),status!=='Rejected')
      return row(item.id,item.title,item.detail,item.status,item.status==='Pending'?<>{review('Reject','Rejected')}{review('Verify','Verified')}</>:item.status==='Open'?review('Resolve case','Resolved'):undefined)
    })}</div>
    return <div className="stat-grid">{adminStats.map(([label,total,to])=><button key={label} className="stat" onClick={()=>navigate(to)}><strong>{total}</strong><span>{label}</span></button>)}</div>
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    if (modal?.fields?.some(field=>field.type!=='file'&&!value(data,field.name))) {
      setError('Please complete all required fields.');return
    }
    const current = modal
    setBusy(true);setError('')
    try {
      await current?.run?.(data)
      setModal(openModal=>openModal===current?null:openModal)
    } catch (err) {setError(err instanceof Error?err.message:'Something went wrong. Please try again.')}
    finally {setBusy(false)}
  }
  const palettePicker = <label className="palette-picker"><Palette size={16} aria-hidden="true"/><span className="palette-swatches" aria-hidden="true">{palette.colors.map(color=><i key={color} style={{background:color}}/>)}</span><select aria-label="Color palette" value={palette.id} onChange={event=>{const selected=palettes.find(item=>item.id===event.target.value);if(selected)setPalette(selected)}}>{palettes.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={14} aria-hidden="true"/></label>
  return <>{landing?<Landing listings={published} palette={palettePicker} enter={enter}/>:<div className={"shell "+(role==='Tenant'?'customer-shell':'')}>
    <aside className="sidebar"><button className="brand" onClick={()=>navigate('Overview')}><span><Home size={22}/></span><div>Proxima<span>FMS</span><small>PROPERTY WORKSPACE</small></div></button>
    <nav aria-label={role+' workspace'}><p>WORKSPACE</p>{navigation[role].map(name=>{const Icon=navIcon(name);return <button key={name} aria-current={page===name?'page':undefined} className={page===name?'selected':''} onClick={()=>navigate(name)}><Icon size={18}/>{name}</button>})}</nav>
    <div className="sidebar-bottom"><div className="profile"><span className="avatar">{people[role].split(' ').map(name=>name[0]).join('')}</span><div><strong>{people[role]}</strong><small>{role} account</small></div></div><button className="reset" onClick={()=>confirm('Reset demo data','This removes changes made in this browser and restores the sample records.','Reset demo',()=>{setState(initial);setRole('Tenant');navigate('Overview');notify('Demo data restored.')})}><RotateCcw size={14}/> Reset demo data</button></div></aside>
    <div className="workspace"><header className="topbar"><span className="crumb"><button className="home-link" onClick={goHome}><Home size={15}/> Home</button> <span>/</span> <strong>{page}</strong></span><div className="top-actions"><span className="demo-label"><i/> Demo mode</span>{palettePicker}<label className="role-picker"><span>Switch role</span><select aria-label="Switch role" value={role} onChange={e=>{enter(e.target.value as Role)}}>{roles.map(item=><option key={item}>{item}</option>)}</select><ChevronDown size={15}/></label></div></header>
    <main id="main" data-page={page}>{page!=='Overview'&&<div className="page-heading workspace-heading"><div><span className="eyebrow">{role.toUpperCase()} WORKSPACE</span><h1>{page}</h1><p>{descriptions[page]}</p></div>{page==='Properties'&&<button className="button primary" onClick={addListing}><Plus size={17}/> New listing</button>}{page==='Maintenance'&&role==='Tenant'&&<button className="button primary" onClick={reportIssue}><Plus size={17}/> Report issue</button>}<span className="heading-mark" aria-hidden="true">{(() => {const Icon=navIcon(page);return <Icon size={70}/>})()}</span></div>}{content()}<footer>ProximaFMS <span>Client walkthrough · Sample data</span></footer></main></div>
    </div>}
    <dialog ref={dialog} aria-labelledby="dialog-title" onCancel={e=>{e.preventDefault();if(!busy)setModal(null)}} onClick={e=>{if(e.target===dialog.current&&!busy)setModal(null)}}>{modal&&<form key={modal.title} onSubmit={submit}><button type="button" className="close" aria-label="Close dialog" disabled={busy} onClick={()=>setModal(null)}><X size={20}/></button><span className="eyebrow">PROXIMA FMS DEMO</span><h2 id="dialog-title">{modal.title}</h2><p>{modal.detail}</p>{modal.fields?.map(field=><label className="field" key={field.name}>{field.label}{field.options?<select name={field.name} required>{field.options.map(item=><option key={item}>{item}</option>)}</select>:field.type==='textarea'?<textarea name={field.name} required maxLength={500} rows={3}/>:<input name={field.name} type={field.type??'text'} required={field.type!=='file'} maxLength={100} min={1} max={100000000} step={1} accept={field.type==='file'?'image/jpeg,image/png,image/webp':undefined}/>}</label>)}{error&&<p className="error" role="alert"><TriangleAlert size={16}/> {error}</p>}<div className="dialog-actions"><button type="button" className="button" disabled={busy} onClick={()=>setModal(null)}>{modal.submit?'Cancel':'Close'}</button>{modal.submit&&<button className="button primary" disabled={busy}>{busy?'Saving…':modal.submit}</button>}</div></form>}</dialog>
    <div className="live" aria-live="polite">{notice&&<div className="toast"><Check size={18}/>{notice}</div>}</div>
  </>
}

createRoot(document.getElementById('root')!).render(<App/>)
