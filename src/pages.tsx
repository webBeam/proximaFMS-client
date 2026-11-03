import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Bath, Check, Clock, Download, MessageSquare, RefreshCw, ShieldCheck, Paperclip, Zap, BedDouble, Columns2, LayoutGrid, Map as MapIcon, FileText, Heart, MapPin, Ruler, Search, Star, Wallet, Wrench, ClipboardList } from 'lucide-react'
import { geoFor, money, moveInCost, uid } from './data'
import type { Application, Listing, Repair } from './data'
import { photo, value } from './ctx'
import type { Ctx } from './ctx'
import { PayFlow, RepairTrack, SignFlow } from './flows'
import { AppSteps, Badge, Columns, Donut, Empty, HBars, Journey, Kpi, Photo, Sparkline, tilt, TrustBadge, TrustMeter } from './ui'

/* ---------- shared bits ---------- */
function Row({id,title,detail,status,buttons,attach}:{id:string; title:string; detail:string; status:string; buttons?:ReactNode; attach?:string}) {
  return <article className="record"><div className="record-icon">{attach?<img src={attach} alt="Attached evidence"/>:<FileText size={20}/>}</div><div className="record-text"><small>{id}</small><h3>{title}</h3><p>{detail}</p></div><Badge status={status}/>{buttons&&<div className="record-actions">{buttons}</div>}</article>
}
const Btn = ({label,onClick,primary=false}:{label:string; onClick:()=>void; primary?:boolean}) => <button className={primary?'btn primary':'btn'} onClick={onClick}>{label}</button>
const Section = ({title,more,children}:{title:string; more?:ReactNode; children:ReactNode}) => <section className="block"><div className="block-head"><h2>{title}</h2>{more}</div>{children}</section>
const Link = ({label,onClick}:{label:string; onClick:()=>void}) => <button className="link" onClick={onClick}>{label} <ArrowRight size={15}/></button>

/* ---------- actions ---------- */
export function addListing(c:Ctx) {
  c.open({title:'Create rental listing',detail:'Submit a property or unit for moderation. It appears in tenant search once approved.',submit:'Submit for review',fields:[
    {name:'title',label:'Property or unit name'},{name:'location',label:'Location'},{name:'kind',label:'Property type',options:['Apartment','Boarding unit','House']},{name:'rent',label:'Monthly rent (LKR)',type:'number'},
  ],run:form=>{
    const listing: Listing = {id:uid('PF'),title:value(form,'title'),location:value(form,'location'),kind:value(form,'kind') as Listing['kind'],rent:Number(value(form,'rent')),status:'Pending review',beds:2,baths:1,area:700,depositMonths:2,advanceMonths:1,trust:'L2',rating:4.5,reviews:0,furnishing:'Unfurnished',amenities:['Water included']}
    c.setState(s=>({...s,listings:[listing,...s.listings]}));c.notify('Listing submitted for moderation.')
  }})
}
export function reportIssue(c:Ctx) {
  c.open({title:'Report a maintenance issue',detail:'Your owner reviews this for Coastal Atrium Suite, Unit 2B.',submit:'Send request',fields:[
    {name:'title',label:'Issue title'},{name:'category',label:'Category',options:['Plumbing','Electrical','Painting','General repairs']},{name:'urgency',label:'Urgency',options:['Normal','Urgent','Emergency']},
    {name:'note',label:'Describe the issue',type:'textarea'},{name:'photo',label:'Photo evidence (optional)',type:'file'},
  ],run:async form=>{
    const attachment = await photo(form,'photo')
    c.setState(s=>({...s,repairs:[{id:uid('MNT'),title:value(form,'title'),category:value(form,'category'),urgency:value(form,'urgency'),note:value(form,'note'),photo:attachment,status:'Reported'},...s.repairs]}))
    c.notify('Maintenance request sent.')
  }})
}
const apply = (c:Ctx,listing:Listing) => c.open({title:'Apply for '+listing.title,detail:money(listing.rent)+' per month · '+listing.location+' · due at move-in '+money(moveInCost(listing)),submit:'Send application',fields:[{name:'note',label:'Household details and preferred move-in date',type:'textarea'}],run:form=>{
  c.setState(s=>({...s,applications:[{id:uid('APP'),listingId:listing.id,note:value(form,'note'),status:'Submitted'},...s.applications]}));c.notify('Application sent to the owner.')
}})

function appButtons(c:Ctx,item:Application) {
  const go = (label:string,next:string,detail:string,primary=true) => <Btn key={label} label={label} primary={primary} onClick={()=>c.confirm(label,detail,label,()=>{c.setState(s=>({...s,applications:s.applications.map(a=>a.id===item.id?{...a,status:next}:a)}));c.notify('Application updated to '+next.toLowerCase()+'.');if(next==='Active'||next==='Reserved')c.celebrate()})}/>
  if (c.role==='Investor' && item.status==='Submitted') return <>{go('Decline','Declined','This closes the application.',false)}{go('Approve','Approved','The tenant can reserve the unit after approval.')}</>
  if (c.role==='Tenant' && item.status==='Approved') return go('Reserve unit','Reserved','Simulate a holding payment. Fully refundable within the 24-hour cooling-off period.')
  if (c.role==='Investor' && item.status==='Reserved') return go('Send agreement','Awaiting tenant signature','Send a sample 12-month agreement.')
  const sign = (label:string,next:string,who:'Tenant'|'Owner',signer:string) => <Btn key={label} primary label={label} onClick={()=>{
    const listing = c.state.listings.find(l=>l.id===item.listingId) ?? c.state.listings[0]
    c.open({title:label,detail:'Review, sign and verify. Your signature is sealed with a tamper-evident certificate.',wide:true,bare:true,body:<SignFlow listing={listing} signer={signer} role={who} onClose={c.close} onSigned={()=>{c.setState(s=>({...s,applications:s.applications.map(a=>a.id===item.id?{...a,status:next}:a)}));c.notify(next==='Active'?'Agreement executed. The tenancy is active.':'Signed. The owner has been asked to countersign.');c.celebrate()}}/>})
  }}/>
  if (c.role==='Tenant' && item.status==='Awaiting tenant signature') return sign('Sign agreement','Awaiting investor signature','Tenant','Anjali Fernando')
  if (c.role==='Investor' && item.status==='Awaiting investor signature') return sign('Countersign','Active','Owner','Nimal Perera')
}
function repairButtons(c:Ctx,item:Repair) {
  const move = (label:string,status:string,detail:string) => <Btn key={label} primary label={label} onClick={()=>c.confirm(label,detail,label,()=>{c.setState(s=>({...s,repairs:s.repairs.map(r=>r.id===item.id?{...r,status}:r)}));c.notify('Job updated to '+status.toLowerCase()+'.');if(status==='Completed')c.celebrate()})}/>
  if (c.role==='Investor' && item.status==='Reported') return move('Publish service job','Open for quotes','Publish the issue to the craftsman marketplace.')
  if (c.role==='Craftsman' && item.status==='Open for quotes') return <Btn primary label="Send quote" onClick={()=>c.open({title:'Quote for '+item.title,detail:'Enter the total for labour and materials.',submit:'Send quote',fields:[{name:'amount',label:'Quote total (LKR)',type:'number'}],run:form=>{c.setState(s=>({...s,repairs:s.repairs.map(r=>r.id===item.id?{...r,status:'Quote submitted',quote:Number(value(form,'amount'))}:r)}));c.notify('Quote sent to the owner.')}})}/>
  if (c.role==='Investor' && item.status==='Quote submitted') return move('Award & fund job','Awarded','Award to Kasun Silva and hold '+money(item.quote??0)+' until completion.')
  if (c.role==='Craftsman' && item.status==='Awarded') return move('Start work','In progress','Mark the job as in progress.')
  if (c.role==='Craftsman' && item.status==='In progress') return <Btn primary label="Submit completion" onClick={()=>c.open({title:'Submit completion',detail:'Send the finished job to the tenant for confirmation.',submit:'Submit completion',fields:[{name:'proof',label:'Completion photo (optional)',type:'file'}],run:async form=>{const proof=await photo(form,'proof');c.setState(s=>({...s,repairs:s.repairs.map(r=>r.id===item.id?{...r,status:'Awaiting tenant confirmation',proof}:r)}));c.notify('Completion sent for confirmation.')}})}/>
  if (c.role==='Tenant' && item.status==='Awaiting tenant confirmation') return move('Confirm repair','Awaiting payout approval','Confirm the issue has been resolved.')
  if (c.role==='Investor' && item.status==='Awaiting payout approval') return move('Approve payout','Completed','Release '+money(item.quote??0)+' to the craftsman.')
}
const repairRow = (c:Ctx,item:Repair) => <div className="stack" key={item.id}><Row id={item.id+' · '+item.urgency} title={item.title} detail={item.category+' · '+item.note+(item.quote?' · '+money(item.quote):'')} status={item.status} buttons={repairButtons(c,item)} attach={item.proof??item.photo}/><RepairTrack status={item.status}/></div>

/* ---------- rentals ---------- */
const FactRow = ({l,mini=false}:{l:Listing; mini?:boolean}) => <div className={'facts'+(mini?' mini':'')}><span><BedDouble size={mini?14:16}/>{l.beds}</span><span><Bath size={mini?14:16}/>{l.baths}</span><span><Ruler size={mini?14:16}/>{l.area} sq ft</span><span><Star size={mini?14:16}/>{l.rating}</span></div>

function MapView({list,pin,setPin,open,tenant}:{list:Listing[]; pin:string|null; setPin:(id:string|null)=>void; open:(id:string)=>void; tenant:boolean}) {
  const picked = list.find(l=>l.id===pin) ?? list[0]
  return <div className="map-wrap">
    <div className="map" role="group" aria-label="Map of rentals around Colombo">
      <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="100" height="62" className="m-land"/>
        <path className="m-sea" d="M0 0H16C20 10 14 18 18 28C22 38 15 46 19 62H0Z"/>
        <path className="m-lake" d="M44 18c5-5 14-4 17 1s-1 11-8 11-13-3-9-12Z"/>
        <path className="m-road" d="M18 40C34 36 46 42 58 38S80 30 100 34M30 62C34 48 44 36 52 20S64 6 70 0M52 62C54 52 66 48 82 50M24 24C40 22 56 24 66 20"/>
        <path className="m-road thin" d="M0 52C20 48 36 56 58 52M60 62C64 46 74 38 100 44M38 0C40 12 46 22 40 34"/>
      </svg>
      <span className="m-label" style={{left:'6%',top:'42%'}}>Indian Ocean</span><span className="m-label" style={{left:'52%',top:'34%'}}>Beira Lake</span>
      {list.map(l=>{const [x,y]=geoFor(l.location);return <button key={l.id} className={'m-pin'+(picked?.id===l.id?' on':'')} style={{left:x+'%',top:y*0.62/0.62+'%'}} onClick={()=>setPin(l.id)} aria-label={l.title+', '+money(l.rent)} aria-pressed={picked?.id===l.id}><b>{Math.round(l.rent/1000)}k</b></button>})}
      {picked&&<article className="m-card"><div className="m-card-photo"><Photo kind={picked.kind} id={picked.id}/></div><div><TrustBadge level={picked.trust}/><h3>{picked.title}</h3><p className="loc"><MapPin size={13}/>{picked.location}</p><strong className="price">{money(picked.rent)} <small>/ month</small></strong>{tenant&&<Btn primary label="View property" onClick={()=>open(picked.id)}/>}</div></article>}
    </div>
  </div>
}

function Rentals({c}:{c:Ctx}) {
  const tenant = c.role==='Tenant'
  const [query,setQuery] = useState(c.seed)
  const [kind,setKind] = useState('')
  const [sort,setSort] = useState('featured')
  const [verified,setVerified] = useState(false)
  const [detail,setDetail] = useState<string|null>(null)
  const [view,setView] = useState<'grid'|'map'>(new URLSearchParams(location.search).get('view')==='map'?'map':'grid')
  const [pin,setPin] = useState<string|null>(null)
  const [compare,setCompare] = useState<string[]>([])
  const source = tenant ? c.state.listings.filter(l=>l.status==='Published') : c.state.listings
  const list = source.filter(l=>(!kind||l.kind===kind)&&(!verified||l.trust==='L3')&&[l.title,l.location,l.kind].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  if (sort!=='featured') list.sort((a,b)=>sort==='low'?a.rent-b.rent:b.rent-a.rent)
  const toggleSave = (id:string) => {const on=c.state.saved.includes(id);c.setState(s=>({...s,saved:on?s.saved.filter(x=>x!==id):[id,...s.saved]}));c.notify(on?'Removed from your shortlist.':'Saved to your shortlist.')}
  const toggleCompare = (id:string) => setCompare(l=>l.includes(id)?l.filter(x=>x!==id):l.length>=4?(c.notify('You can compare up to 4 homes.'),l):[...l,id])
  const openCompare = () => {
    const items = compare.map(id=>c.state.listings.find(l=>l.id===id)).filter((l):l is Listing=>Boolean(l))
    const rows: [string,(l:Listing)=>ReactNode][] = [['Monthly rent',l=>money(l.rent)],['Deposit',l=>l.depositMonths+' months'],['Advance',l=>l.advanceMonths+' months'],['Due at move-in',l=>money(moveInCost(l))],['Bedrooms · baths',l=>l.beds+' · '+l.baths],['Floor area',l=>l.area+' sq ft'],['Furnishing',l=>l.furnishing],['Rating',l=>l.rating+' ('+l.reviews+')'],['Trust',l=><TrustBadge level={l.trust}/>],['Amenities',l=>l.amenities.join(', ')]]
    c.open({title:'Compare homes',detail:'Side by side across cost, space and trust.',wide:true,body:<div className="compare-scroll"><table className="compare"><thead><tr><th/>{items.map(l=><th key={l.id}>{l.title}<small>{l.location}</small></th>)}</tr></thead><tbody>{rows.map(([label,get])=><tr key={label}><th scope="row">{label}</th>{items.map(l=><td key={l.id}>{get(l)}</td>)}</tr>)}</tbody></table></div>})
  }
  const featured = list.find(l=>l.id===detail)
  if (featured) {
    const applied = c.state.applications.some(a=>a.listingId===featured.id&&a.status!=='Declined')
    const saved = c.state.saved.includes(featured.id)
    return <section className="detail">
      <button className="link back" onClick={()=>setDetail(null)}>← Back to results</button>
      <div className="detail-photo"><Photo kind={featured.kind} id={featured.id} eager/><span className="photo-badge"><TrustBadge level={featured.trust}/></span></div>
      <div className="detail-copy"><span className="eyebrow">{featured.kind} · sample listing</span><h2>{featured.title}</h2><p className="loc"><MapPin size={16}/> {featured.location} · exact address shared after approval</p>
        <FactRow l={featured}/>
        <div className="chips">{[featured.furnishing,...featured.amenities].map(a=><span key={a}>{a}</span>)}</div>
        <div className="cost"><h3>Cost before you apply</h3><dl><div><dt>Monthly rent</dt><dd>{money(featured.rent)}</dd></div><div><dt>Deposit · {featured.depositMonths} months</dt><dd>{money(featured.rent*featured.depositMonths)}</dd></div><div><dt>Advance · {featured.advanceMonths} {featured.advanceMonths===1?'month':'months'}</dt><dd>{money(featured.rent*featured.advanceMonths)}</dd></div></dl><p className="cost-total"><span>Due at move-in</span><strong>{money(moveInCost(featured))}</strong></p></div>
        <div className="actions">{applied?<Btn primary label="Track your application" onClick={()=>c.navigate('Applications')}/>:<Btn primary label="Start application" onClick={()=>apply(c,featured)}/>}<button className={'btn'+(saved?' on':'')} aria-pressed={saved} onClick={()=>toggleSave(featured.id)}><Heart size={16}/> {saved?'Saved':'Save'}</button></div>
      </div>
    </section>
  }
  return <>
    <div className="searchbar" data-tour="searchbar">
      <label className="grow"><span>Property or neighbourhood</span><div className="field-line"><Search size={18}/><input aria-label="Search listings" placeholder="Try Rajagiriya or Dehiwala" value={query} onChange={e=>setQuery(e.target.value)}/></div></label>
      <label><span>Property type</span><select value={kind} onChange={e=>setKind(e.target.value)}><option value="">All types</option>{['Apartment','Boarding unit','House'].map(k=><option key={k}>{k}</option>)}</select></label>
      <label><span>Sort by</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Rent: low to high</option><option value="high">Rent: high to low</option></select></label>
      <label className="switch-label"><span>Trust</span><span className="switch"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/><i aria-hidden="true"/>Verified only</span></label>
    </div>
    <div className="count"><span>{list.length} {list.length===1?'property':'properties'}</span>{(query||kind||verified)&&<button className="link" onClick={()=>{setQuery('');setKind('');setVerified(false)}}>Clear filters</button>}
      <div className="seg" role="group" aria-label="View"><button aria-pressed={view==='grid'} onClick={()=>setView('grid')}><LayoutGrid size={15}/> Grid</button><button aria-pressed={view==='map'} onClick={()=>setView('map')}><MapIcon size={15}/> Map</button></div></div>
    {view==='map'&&list.length>0&&<MapView list={list} pin={pin} setPin={setPin} open={id=>{setDetail(id);window.scrollTo({top:0})}} tenant={tenant}/>}
    {list.length===0?<Empty text="No properties match your search."/>:view==='grid'&&<div className="grid-cards" data-tour="cards">{list.map(l=><article className="property tilt" key={l.id} {...tilt}>
      <div className="property-art"><Photo kind={l.kind} id={l.id}/><span className="chip-kind">{l.kind}</span>{tenant&&<button className={'heart'+(c.state.saved.includes(l.id)?' on':'')} aria-pressed={c.state.saved.includes(l.id)} aria-label={(c.state.saved.includes(l.id)?'Remove ':'Save ')+l.title} onClick={()=>toggleSave(l.id)}><Heart size={18}/></button>}</div>
      <div className="property-body"><TrustBadge level={l.trust}/><h3>{l.title}</h3><p className="loc"><MapPin size={14}/>{l.location}</p><FactRow l={l} mini/><strong className="price">{money(l.rent)} <small>/ month</small></strong>
        <div className="foot">{tenant?<><Btn primary label="View property" onClick={()=>{setDetail(l.id);window.scrollTo({top:0})}}/><label className="compare-check"><input type="checkbox" checked={compare.includes(l.id)} onChange={()=>toggleCompare(l.id)}/><span><Columns2 size={14}/> Compare</span></label></>:<><Badge status={l.status}/>{l.status==='Published'&&<Btn label="Pause" onClick={()=>{c.setState(s=>({...s,listings:s.listings.map(x=>x.id===l.id?{...x,status:'Paused'}:x)}));c.notify('Listing paused.')}}/>}{/Paused|Rejected/.test(l.status)&&<Btn label="Resubmit" onClick={()=>{c.setState(s=>({...s,listings:s.listings.map(x=>x.id===l.id?{...x,status:'Pending review'}:x)}));c.notify('Listing sent for moderation.')}}/>}</>}</div>
      </div></article>)}</div>}
    {compare.length>0&&<div className="compare-tray" role="region" aria-label="Compare tray"><b>{compare.length}</b><span>{compare.length===1?'home':'homes'} selected · up to 4</span><button className="btn primary" disabled={compare.length<2} onClick={openCompare}><Columns2 size={16}/> Compare</button><button className="link" onClick={()=>setCompare([])}>Clear</button></div>}
  </>
}

/* ---------- overviews ---------- */
function TenantOverview({c}:{c:Ctx}) {
  const open = c.state.repairs.filter(r=>r.status!=='Completed')
  const saved = c.state.saved.map(id=>c.state.listings.find(l=>l.id===id)).filter((l):l is Listing=>Boolean(l))
  const latest = c.state.repairs[0]
  return <>
    <section className="hero-card"><div className="hero-copy"><span className="tag">Colonial &amp; modern living</span><h1>Curated sanctuaries in the island’s <em>premier enclaves.</em></h1><p>Welcome back, Anjali. Pay rent, report a problem or find your next residence. Every home is verified before it is listed.</p><div className="actions"><Btn primary label="Explore residences" onClick={()=>c.navigate('Find a rental')}/><Btn label="Report an issue" onClick={()=>reportIssue(c)}/></div><dl className="hero-stats"><div><dt>120+</dt><dd>Inspected suites</dd></div><div><dt>98.4%</dt><dd>Tenant retention</dd></div><div><dt>24 hr</dt><dd>Concierge response</dd></div></dl></div><div className="hero-photo"><Photo kind="House" id="skyline" eager/><div className="featured"><small>Featured sanctuary</small><b>Sapphire Ocean Terraces 18B</b><em>{money(340000)} / mo</em></div></div></section>
    <Section title="Your tenancy journey" more={<span className="muted">Stage {open.length?6:5} of 7</span>}><div className="panel" data-tour="journey"><Journey current={open.length?5:4}/></div></Section>
    <Section title="At home in Coastal Atrium Suite" more={<span className="muted">Unit 2B</span>}>
      <div className="grid-3">
        <article className="tile"><span className="tile-icon mint"><Wallet size={20}/></span><h3>{c.state.paid?'November rent paid':'November rent is due'}</h3><p>{money(85000)} · 5 November</p><Btn primary label={c.state.paid?'Open receipt':'View invoice'} onClick={()=>c.navigate('Rent & receipts')}/></article>
        <article className="tile"><span className="tile-icon sun"><Wrench size={20}/></span><h3>Need a repair?</h3><p>Add a description and photo for your owner.</p><Btn primary label="Report an issue" onClick={()=>reportIssue(c)}/></article>
        <article className="tile"><span className="tile-icon lime"><ClipboardList size={20}/></span><h3>My applications</h3><p>{c.state.applications.length} in your activity</p><Btn label="Track applications" onClick={()=>c.navigate('Applications')}/></article>
      </div>
    </Section>
    {saved.length>0&&<Section title="Your shortlist" more={<Link label="Find more" onClick={()=>c.navigate('Find a rental')}/>}><div className="saved-row">{saved.map(l=><button key={l.id} className="saved" onClick={()=>c.navigate('Find a rental')}><Photo kind={l.kind} id={l.id}/><span><b>{l.title}</b><small>{l.location} · {money(l.rent)}</small></span></button>)}</div></Section>}
    {latest&&<Section title="Latest repair" more={<Link label="View all" onClick={()=>c.navigate('Maintenance')}/>}><div className="records">{repairRow(c,latest)}</div></Section>}
  </>
}

function InvestorOverview({c}:{c:Ctx}) {
  const queue = c.state.applications.filter(a=>a.status==='Submitted')
  const repairs = c.state.repairs.filter(r=>['Reported','Quote submitted','Awaiting payout approval'].includes(r.status))
  const published = c.state.listings.filter(l=>l.status==='Published').length
  return <>
    <section className="banner"><div><span className="eyebrow">Investor portfolio</span><h1>Manage your rentals.</h1><p>Review applications and repairs that need your decision.</p><div className="actions"><Btn primary label="New listing" onClick={()=>addListing(c)}/></div></div><div className="banner-photo"><Photo kind="House" id="courtyard"/></div></section>
    <div className="grid-4" data-tour="kpis">
      <Kpi tone="mint" label="Rent collected · Nov" count={242500} format={money} hint="+5.4% vs October"><Sparkline values={[180,195,210,205,230,242]}/></Kpi>
      <Kpi tone="coral" label="Overdue" count={32500} format={money} hint="1 tenant · 4 days late"/>
      <Kpi tone="lime" label="Published ads" count={published} hint="3,977 views this month"><Sparkline values={[40,52,48,70,66,92]}/></Kpi>
      <Kpi tone="sun" label="Open repairs" count={repairs.length} hint="Awaiting your decision"/>
    </div>
    <div className="grid-dash">
      <div className="panel"><h3>Rent collected</h3><p className="muted">Last six months, LKR thousands</p><Columns format={v=>String(v)} data={[{label:'Jun',value:196},{label:'Jul',value:210},{label:'Aug',value:204},{label:'Sep',value:228},{label:'Oct',value:230},{label:'Nov',value:242}]}/></div>
      <div className="panel center"><h3>Occupancy</h3><Donut value={87} label="occupied"/><p className="muted">13 of 15 units let</p></div>
      <div className="panel"><h3>Your trust level</h3><TrustMeter level={2}/><Btn label="Upload ownership proof" onClick={()=>c.notify('Demo only: proof upload is simulated.')}/></div>
    </div>
    <Section title="Applications to review" more={<Link label="View all" onClick={()=>c.navigate('Applications')}/>}><div className="records" data-tour="apps">{queue.length?queue.map(a=><div className="stack" key={a.id}><Row id={a.id} title={c.state.listings.find(l=>l.id===a.listingId)?.title??'Application'} detail={a.note} status={a.status} buttons={appButtons(c,a)}/><AppSteps status={a.status}/></div>):<Empty text="You’re caught up on applications."/>}</div></Section>
    <Section title="Repairs that need attention" more={<Link label="View all" onClick={()=>c.navigate('Maintenance')}/>}><div className="records">{repairs.length?repairs.map(r=>repairRow(c,r)):<Empty text="No repair decisions are pending."/>}</div></Section>
  </>
}

function CraftsmanOverview({c}:{c:Ctx}) {
  const available = c.state.repairs.filter(r=>r.status==='Open for quotes')
  const pipeline = c.state.repairs.filter(r=>!['Reported','Open for quotes','Completed'].includes(r.status))
  const earned = c.state.repairs.filter(r=>r.status==='Completed').reduce((sum,r)=>sum+(r.quote??0),0)
  return <>
    <section className="banner sun"><div><span className="eyebrow">Craftsman workspace</span><h1>Find work. Get it done.</h1><p>Quote for jobs, share progress and get paid after approval.</p><div className="actions"><Btn primary label="View earnings" onClick={()=>c.navigate('Earnings')}/></div></div><div className="banner-photo"><Photo kind="House" id="bath"/></div></section>
    <div className="grid-4">
      <Kpi tone="lime" label="Open jobs" count={available.length} hint="Near Colombo"/>
      <Kpi tone="sun" label="In pipeline" count={pipeline.length} hint="Quotes and active work"/>
      <Kpi tone="mint" label="Earned" count={earned} format={money} hint="Released payouts"/>
      <Kpi tone="coral" label="Rating" value="4.9" hint="From 38 jobs"/>
    </div>
    <Section title="Open jobs" more={<Link label="Open marketplace" onClick={()=>c.navigate('Job marketplace')}/>}>{available.length?<div className="grid-3" data-tour="jobs">{available.map(r=><article className="tile" key={r.id}><span className={'urgency '+r.urgency.toLowerCase()}>{r.urgency}</span><h3>{r.title}</h3><p>{r.category} · {r.note}</p>{repairButtons(c,r)}</article>)}</div>:<Empty text="No jobs are open for quotes right now."/>}</Section>
    <Section title="Work in your pipeline" more={<Link label="Open my work" onClick={()=>c.navigate('My work')}/>}><div className="records">{pipeline.length?pipeline.map(r=>repairRow(c,r)):<Empty text="Jobs appear here after you send a quote."/>}</div></Section>
  </>
}

function AdminOverview({c}:{c:Ctx}) {
  const ver = c.state.reviews.filter(r=>r.kind==='Verification'&&r.status==='Pending').length
  const mod = c.state.listings.filter(l=>l.status==='Pending review').length
  const dis = c.state.reviews.filter(r=>r.kind==='Dispute'&&r.status==='Open').length
  const tiles: [string,number,string,'mint'|'lime'|'sun'|'coral',string][] = [['Verification queue',ver,'Verification','mint','Oldest 9h · SLA 24h'],['Listings to moderate',mod,'Listing moderation','lime','Review SLA 12h'],['Open disputes',dis,'Disputes','coral','Oldest 2d · SLA 5d']]
  return <>
    <section className="banner teal"><div><span className="eyebrow">Admin operations</span><h1>Review queues.</h1><p>Verification, moderation and disputes, with SLA timers on every queue.</p></div><div className="banner-photo"><Photo kind="House" id="penthouse"/></div></section>
    <div className="grid-3" data-tour="queues">{tiles.map(([label,total,to,tone,hint])=><button key={label} className={'kpi click '+tone} onClick={()=>c.navigate(to)}><span>{label}</span><strong>{total}</strong><small>{hint}</small><ArrowRight className="kpi-go" size={18}/></button>)}</div>
    <Reports/>
  </>
}

function Reports() {
  return <div className="grid-dash two">
    <div className="panel"><h3>Search to lease funnel</h3><p className="muted">Last 30 days</p><HBars data={[{label:'Searches',value:12480},{label:'Enquiries',value:3120},{label:'Applications',value:842},{label:'Leases signed',value:211}]}/></div>
    <div className="panel"><h3>Verification throughput</h3><p className="muted">Cases decided per day</p><Columns format={v=>String(v)} data={[{label:'Mon',value:24},{label:'Tue',value:31},{label:'Wed',value:28},{label:'Thu',value:35},{label:'Fri',value:22},{label:'Sat',value:12},{label:'Sun',value:9}]}/></div>
  </div>
}

/* ---------- workspace pages ---------- */
function Chips({options,value,onChange}:{options:string[]; value:string; onChange:(v:string)=>void}) {
  return <div className="fchips" role="group">{options.map(o=><button key={o} aria-pressed={o===value} className={o===value?'on':''} onClick={()=>onChange(o)}>{o}</button>)}</div>
}
const jobPhoto = (category:string) => category==='Plumbing'?'bath':category==='Electrical'?'penthouse':category==='HVAC'?'terrace':'courtyard'
const kmFor = (id:string) => (2+id.charCodeAt(id.length-1)%7+0.4).toFixed(1)+' km'

function JobCard({c,r}:{c:Ctx; r:Repair}) {
  return <article className="job-card">
    <div className="job-photo"><Photo kind="House" id={jobPhoto(r.category)}/><span className={'urgency '+r.urgency.toLowerCase()}>{r.urgency}</span></div>
    <div className="job-body">
      <div className="job-top"><div><small>{r.id} · {r.category}</small><h3>{r.title}</h3></div><Badge status={r.status}/></div>
      <div className="job-meta"><span><MapPin size={14}/>{kmFor(r.id)}</span><span><Clock size={14}/>Posted today</span>{r.quote&&<b>{money(r.quote)}</b>}</div>
      <RepairTrack status={r.status}/>
      <div className="record-actions">{repairButtons(c,r)}</div>
    </div>
  </article>
}

function AppCard({c,a}:{c:Ctx; a:Application}) {
  const l = c.state.listings.find(x=>x.id===a.listingId) ?? c.state.listings[0]
  return <article className="app-card">
    <div className="app-photo"><Photo kind={l.kind} id={l.id}/></div>
    <div className="app-body">
      <div className="job-top"><div><small>{a.id}</small><h3>{l.title}</h3><p className="loc"><MapPin size={13}/>{l.location} · {money(l.rent)} / month</p></div><Badge status={a.status}/></div>
      <AppSteps status={a.status}/>
      <div className="record-actions">{appButtons(c,a)}</div>
    </div>
  </article>
}

function MyTenancy({c}:{c:Ctx}) {
  const home = c.state.listings[0]
  const doc = (title:string,detail:string,icon:ReactNode) => <button className="doc-tile" onClick={()=>c.open({title,detail,body:<p className="doc-lines"><i/><i/><i/><i className="short"/></p>})}>{icon}<b>{title}</b><small>View</small></button>
  return <>
    <section className="home-card">
      <div className="home-photo"><Photo kind={home.kind} id={home.id} eager/><div className="home-tag"><b>{home.title}</b><span>Unit 2B · {home.location}</span></div></div>
      <div className="home-side">
        <div className="home-ring"><Donut value={58} label="Month 7 of 12"/></div>
        <dl className="home-facts"><div><dt>Rent</dt><dd>{money(home.rent)}</dd></div><div><dt>Deposit held</dt><dd>{money(home.rent*3)}</dd></div><div><dt>Lease ends</dt><dd>31 May</dd></div></dl>
        <div className="actions"><Btn primary label={c.state.paid?'Rent paid':'Pay rent'} onClick={()=>c.navigate('Rent & receipts')}/><Btn label="Renew or exit" onClick={()=>c.open({title:'Renew or exit',detail:'Choose what happens at the end of your lease.',body:<div className="choice-row"><button className="btn primary" onClick={()=>{c.close();c.notify('Renewal request sent to the owner.')}}><RefreshCw size={16}/> Renew 12 months</button><button className="btn" onClick={()=>{c.close();c.notify('Move-out notice recorded. Inspection will be booked.')}}>Give notice</button></div>})}/></div>
      </div>
    </section>
    <Section title="Documents"><div className="doc-grid">{doc('Lease agreement','Signed 1 June · 12 months',<FileText size={22}/>)}{doc('House rules','Quiet hours, guests and pets',<ClipboardList size={22}/>)}{doc('Move-in inspection','Condition report with photos',<ShieldCheck size={22}/>)}</div></Section>
    <Section title="Quick help"><div className="grid-3">
      <button className="quick" onClick={()=>reportIssue(c)}><Wrench size={20}/><b>Report an issue</b><ArrowRight size={16}/></button>
      <button className="quick" onClick={()=>c.open({title:'Message your owner',detail:'Nimal Perera usually replies within a day.',submit:'Send message',fields:[{name:'m',label:'Message',type:'textarea'}],run:()=>c.notify('Message sent to your owner.')})}><MessageSquare size={20}/><b>Message owner</b><ArrowRight size={16}/></button>
      <button className="quick" onClick={()=>c.notify('Inspection request sent. You will get a date by SMS.')}><ShieldCheck size={20}/><b>Request inspection</b><ArrowRight size={16}/></button>
    </div></Section>
  </>
}

const history = [['October','Card','REC-1098'],['September','LANKAQR','REC-1087'],['August','Bank transfer','REC-1071'],['July','Card','REC-1063']]
function TenantRent({c}:{c:Ctx}) {
  const [auto,setAuto] = useState(true)
  const paid = c.state.paid
  const pay = () => c.open({title:'Pay November rent',detail:'Demo checkout. Nothing is charged.',bare:true,body:<PayFlow amount={85000} label="November 2026 rent" onClose={c.close} onPaid={method=>{c.setState(s=>({...s,paid:true}));c.notify('Paid by '+method+'. Receipt sent.');c.celebrate()}}/>})
  const receipt = (title:string,id:string,amount:number) => c.open({title:'Receipt · '+id,detail:title+' · '+money(amount),body:<p className="doc-lines"><i/><i/><i className="short"/></p>})
  return <>
    <section className={'due-card'+(paid?' paid':'')} data-tour="invoice">
      <div><small>{paid?'November rent':'Due 5 November'}</small><strong>{money(85000)}</strong><span>{paid?<><Check size={15}/> Paid today</>:<><Clock size={15}/> 3 days left</>}</span></div>
      {paid?<Btn label="View receipt" onClick={()=>receipt('November 2026 rent','REC-1103',85000)}/>:<button className="btn lux" onClick={pay}><Wallet size={17}/> Pay now</button>}
    </section>
    <label className="switch-row"><span><Zap size={18}/><b>Autopay</b><small>Pay on the 5th</small></span><input type="checkbox" role="switch" checked={auto} onChange={e=>{setAuto(e.target.checked);c.notify('Autopay '+(e.target.checked?'on':'off')+'.')}}/></label>
    <Section title="Payment history"><div className="history">{history.map(([m,method,id])=><div key={id}><span className="h-month">{m}</span><span className="h-method">{method}</span><b>{money(85000)}</b><Badge status="Paid"/><button className="btn" onClick={()=>receipt(m+' 2026 rent',id,85000)}><Download size={14}/> Receipt</button></div>)}</div></Section>
  </>
}

function InvestorRent({c}:{c:Ctx}) {
  const units = c.state.listings.filter(l=>l.status==='Published')
  const statusOf = (l:Listing,i:number) => l.id==='PF-101'?(c.state.paid?'Paid':'Due'):i%3===2?'Overdue':'Paid'
  return <>
    <div className="grid-3"><Kpi tone="mint" label="Collected" count={242500} format={money}/><Kpi tone="sun" label="Due this week" count={c.state.paid?0:85000} format={money}/><Kpi tone="coral" label="Overdue" count={32500} format={money}/></div>
    <Section title="Units"><div className="ledger">{units.map((l,i)=>{const st=statusOf(l,i);return <article key={l.id}><div className="l-thumb"><Photo kind={l.kind} id={l.id}/></div><div><b>{l.title}</b><small>{l.location}</small></div><b className="l-amt">{money(l.rent)}</b><Badge status={st}/>{st==='Paid'?<span className="l-ok"><Check size={16}/></span>:<Btn label="Send reminder" onClick={()=>c.notify('Reminder sent for '+l.title+'.')}/>}</article>})}</div></Section>
  </>
}

function Maintenance({c}:{c:Ctx}) {
  const [f,setF] = useState('All')
  const list = c.state.repairs.filter(r=>f==='All'||(f==='Open'?r.status!=='Completed':r.status==='Completed'))
  return <><Chips options={['All','Open','Done']} value={f} onChange={setF}/><div className="job-list">{list.map(r=><JobCard key={r.id} c={c} r={r}/>)}{!list.length&&<Empty text="Nothing here yet."/>}</div></>
}
function Marketplace({c}:{c:Ctx}) {
  const [f,setF] = useState('All')
  const list = c.state.repairs.filter(r=>r.status==='Open for quotes'&&(f==='All'||r.category===f))
  return <><Chips options={['All','Plumbing','Electrical','HVAC']} value={f} onChange={setF}/><div className="job-list" data-tour="jobs">{list.map(r=><JobCard key={r.id} c={c} r={r}/>)}{!list.length&&<Empty text="No open jobs in this trade."/>}</div></>
}
function MyWork({c}:{c:Ctx}) {
  const [f,setF] = useState('Active')
  const list = c.state.repairs.filter(r=>!['Reported','Open for quotes'].includes(r.status)&&(f==='Active'?r.status!=='Completed':r.status==='Completed'))
  return <><Chips options={['Active','Completed']} value={f} onChange={setF}/><div className="job-list">{list.map(r=><JobCard key={r.id} c={c} r={r}/>)}{!list.length&&<Empty text={f==='Active'?'Send a quote in the marketplace to start a job.':'Completed jobs appear here.'}/>}</div></>
}
const payouts: [string,string,number,string][] = [['#JOB-7721','Copper line reroute · Galle Fort Pavilion',18500,'Oct 24'],['#JOB-7690','Geyser valve assembly · Arcadia Mount',34200,'Oct 19'],['#JOB-7643','Main panel surge protection · Kandy Hillside',42000,'Oct 14']]
function Earnings({c}:{c:Ctx}) {
  const done = c.state.repairs.filter(r=>r.status==='Completed')
  const extra = done.reduce((n,r)=>n+(r.quote??0),0)
  const total = payouts.reduce((n,p)=>n+p[2],0)+extra
  return <>
    <div className="grid-3"><Kpi tone="mint" label="Released" count={total} format={money}/><Kpi tone="sun" label="In escrow" count={c.state.repairs.filter(r=>r.status==='Awarded'||r.status==='In progress').reduce((n,r)=>n+(r.quote??0),0)} format={money}/><Kpi tone="lime" label="Jobs done" count={38+done.length}/></div>
    <Section title="Payouts"><div className="ledger payouts">{[...done.map(r=>['#'+r.id,r.title,r.quote??0,'Today'] as [string,string,number,string]),...payouts].map(([id,t,amt,when])=><article key={id}><div className="l-icon"><Wallet size={18}/></div><div><b>{t}</b><small>{id} · {when}</small></div><b className="l-amt">{money(amt)}</b><Badge status="Paid"/></article>)}</div></Section>
  </>
}

function VerifyCard({c,r}:{c:Ctx; r:{id:string; title:string; detail:string; status:string; age:string}}) {
  const decide = (label:string,status:string,primary:boolean) => <Btn key={label} primary={primary} label={label} onClick={()=>c.confirm(label+' '+r.title,'Record this decision in the audit trail.',label,()=>{c.setState(s=>({...s,reviews:s.reviews.map(x=>x.id===r.id?{...x,status}:x)}));c.notify(r.title+': '+status.toLowerCase()+'.')})}/>
  return <article className="ver-card">
    <span className="avatar big">{r.title.split(' ').map(n=>n[0]).join('')}</span>
    <div className="ver-main"><div className="job-top"><div><small>{r.id}</small><h3>{r.title}</h3></div><Badge status={r.status}/></div>
      <p>{r.detail.split(' · ')[0]}</p>
      <div className="doc-chips"><button onClick={()=>c.notify('Opening identity document (demo).')}><Paperclip size={13}/> Identity.pdf</button><button onClick={()=>c.notify('Opening supporting document (demo).')}><Paperclip size={13}/> {r.detail.includes('Trade')?'Trade licence.pdf':'Title deed.pdf'}</button><span className="sla"><Clock size={13}/> {r.age} · SLA 24h</span></div>
    </div>
    {r.status==='Pending'&&<div className="record-actions">{decide('Reject','Rejected',false)}{decide('Verify','Verified',true)}</div>}
  </article>
}
function Moderation({c}:{c:Ctx}) {
  const queue = c.state.listings.filter(l=>l.status==='Pending review')
  const set = (l:Listing,status:string) => {c.setState(s=>({...s,listings:s.listings.map(x=>x.id===l.id?{...x,status}:x)}));c.notify(l.title+': '+status.toLowerCase()+'.');if(status==='Published')c.celebrate()}
  if (!queue.length) return <Empty text="Queue clear. New listings appear here."/>
  return <div className="mod-list">{queue.map(l=><article className="mod-card" key={l.id}>
    <div className="mod-photo"><Photo kind={l.kind} id={l.id}/><span className="chip-kind">Leasehold 24 mo</span><div className="mod-cap"><b>{l.title}</b><span><MapPin size={14}/> {l.location}</span><em>{money(l.rent)} / mo</em></div></div>
    <div className="mod-body"><div className="checks"><span><Check size={15}/> Title deed verified</span><span><Check size={15}/> Photos are original</span><span><Check size={15}/> Owner identity L3</span></div>
      <div className="record-actions"><Btn label="Reject" onClick={()=>c.confirm('Reject listing','The owner can resubmit.','Reject',()=>set(l,'Rejected'))}/><Btn label="Request revision" onClick={()=>c.notify('Revision requested.')}/><Btn primary label="Approve & publish" onClick={()=>set(l,'Published')}/></div></div>
  </article>)}</div>
}
function Disputes({c}:{c:Ctx}) {
  const [owner,setOwner] = useState(50)
  const total = 85000
  const items = c.state.reviews.filter(r=>r.kind==='Dispute')
  return <div className="mod-list">{items.map(r=><article className="dispute-card" key={r.id}>
    <div className="job-top"><div><small>{r.id} · waiting {r.age}</small><h3>{r.title}</h3></div><Badge status={r.status}/></div>
    <div className="claims"><div><small>Owner claims</small><b>{money(total)}</b><span>Cleaning and repaint</span></div><div><small>Tenant offers</small><b>{money(20000)}</b><span>Photos attached</span></div></div>
    {r.status==='Open'&&<div className="split"><label>Escrow split<input type="range" min={0} max={100} step={5} value={owner} onChange={e=>setOwner(Number(e.target.value))}/></label>
      <div className="split-bar"><i style={{width:owner+'%'}}/></div><div className="split-vals"><span>Owner <b>{money(total*owner/100)}</b></span><span>Tenant <b>{money(total*(100-owner)/100)}</b></span></div>
      <Btn primary label="Issue settlement" onClick={()=>c.confirm('Issue settlement','Release the escrow as split above.','Issue',()=>{c.setState(s=>({...s,reviews:s.reviews.map(x=>x.id===r.id?{...x,status:'Resolved'}:x)}));c.notify('Settlement issued.')})}/></div>}
  </article>)}</div>
}

/* ---------- router ---------- */
export function Page({c}:{c:Ctx}) {
  const {page,role,state} = c
  if (page==='Overview') return role==='Tenant'?<TenantOverview c={c}/>:role==='Investor'?<InvestorOverview c={c}/>:role==='Craftsman'?<CraftsmanOverview c={c}/>:<AdminOverview c={c}/>
  if (page==='Find a rental'||page==='Properties') return <Rentals c={c}/>
  if (page==='My tenancy') return <MyTenancy c={c}/>
  if (page==='Applications') return <div className="job-list">{state.applications.map(a=><AppCard key={a.id} c={c} a={a}/>)}{!state.applications.length&&<Empty text="No applications yet."/>}</div>
  if (page==='Rent & receipts') return <TenantRent c={c}/>
  if (page==='Rent ledger') return <InvestorRent c={c}/>
  if (page==='Maintenance') return <Maintenance c={c}/>
  if (page==='Job marketplace') return <Marketplace c={c}/>
  if (page==='My work') return <MyWork c={c}/>
  if (page==='Earnings') return <Earnings c={c}/>
  if (page==='Listing moderation') return <Moderation c={c}/>
  if (page==='Verification') return <div className="job-list">{state.reviews.filter(r=>r.kind==='Verification').map(r=><VerifyCard key={r.id} c={c} r={r}/>)}</div>
  if (page==='Disputes') return <Disputes c={c}/>
  if (page==='Reports') return <Reports/>
  return null
}
