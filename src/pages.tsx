import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Bath, BedDouble, Columns2, LayoutGrid, Map as MapIcon, FileText, Heart, MapPin, Ruler, Search, Star, Wallet, Wrench, ClipboardList } from 'lucide-react'
import { geoFor, money, moveInCost, uid } from './data'
import type { Application, Listing, Repair } from './data'
import { photo, value } from './ctx'
import type { Ctx } from './ctx'
import { RoleArt } from './art'
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
  c.open({title:'Report a maintenance issue',detail:'Your owner reviews this for Cinnamon Court, Unit 2B.',submit:'Send request',fields:[
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
    <section className="hero-card"><div className="hero-copy"><span className="eyebrow">Your tenant space</span><h1>Make yourself <em>at home.</em></h1><p>Welcome back, Anjali. Pay rent, report a problem or find your next place.</p><div className="actions"><Btn primary label="Explore rentals" onClick={()=>c.navigate('Find a rental')}/><Btn label="Report an issue" onClick={()=>reportIssue(c)}/></div></div><div className="hero-photo"><Photo kind="House" eager/></div></section>
    <Section title="Your tenancy journey" more={<span className="muted">Stage {open.length?6:5} of 7</span>}><div className="panel" data-tour="journey"><Journey current={open.length?5:4}/></div></Section>
    <Section title="At home in Cinnamon Court" more={<span className="muted">Unit 2B</span>}>
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
    <section className="banner"><div><span className="eyebrow">Investor portfolio</span><h1>Manage your rentals.</h1><p>Review applications and repairs that need your decision.</p><div className="actions"><Btn primary label="New listing" onClick={()=>addListing(c)}/></div></div><RoleArt role="Investor"/></section>
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
    <section className="banner sun"><div><span className="eyebrow">Craftsman workspace</span><h1>Find work. Get it done.</h1><p>Quote for jobs, share progress and get paid after approval.</p><div className="actions"><Btn primary label="View earnings" onClick={()=>c.navigate('Earnings')}/></div></div><RoleArt role="Craftsman"/></section>
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
    <section className="banner teal"><div><span className="eyebrow">Admin operations</span><h1>Review queues.</h1><p>Verification, moderation and disputes, with SLA timers on every queue.</p></div><RoleArt role="Admin"/></section>
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

/* ---------- router ---------- */
export function Page({c}:{c:Ctx}) {
  const {page,role,state} = c
  if (page==='Overview') return role==='Tenant'?<TenantOverview c={c}/>:role==='Investor'?<InvestorOverview c={c}/>:role==='Craftsman'?<CraftsmanOverview c={c}/>:<AdminOverview c={c}/>
  if (page==='Find a rental'||page==='Properties') return <Rentals c={c}/>
  if (page==='Applications'||page==='My tenancy') {
    const items = state.applications.filter(a=>page==='Applications'||!['Submitted','Declined','Approved'].includes(a.status))
    return <div className="records">{page==='My tenancy'&&<Row id="LSE-082" title="Cinnamon Court · Unit 2B" detail="Current tenancy · 12-month lease · LKR 85,000 per month" status="Active"/>}{items.map(a=><div className="stack" key={a.id}><Row id={a.id} title={state.listings.find(l=>l.id===a.listingId)?.title??'Application'} detail={a.note} status={a.status} buttons={appButtons(c,a)}/><AppSteps status={a.status}/></div>)}{!items.length&&page!=='My tenancy'&&<Empty text="No applications yet."/>}</div>
  }
  if (page==='Rent & receipts'||page==='Rent ledger') return <div className="records" data-tour="invoice"><Row id="INV-1103" title="November 2026 rent" detail={'Cinnamon Court, Unit 2B · Due 5 November · '+money(85000)} status={state.paid?'Paid':'Due'} buttons={role==='Tenant'?(state.paid?<Btn label="View receipt" onClick={()=>c.open({title:'Receipt · REC-1103',detail:'Anjali Fernando · November 2026 rent · '+money(85000)+' · paid by simulated online payment.'})}/>:<Btn primary label="Pay now" onClick={()=>c.open({title:'Pay November rent',detail:'Cinnamon Court, Unit 2B · demo checkout, nothing is charged.',bare:true,body:<PayFlow amount={85000} label="November 2026 rent" onClose={c.close} onPaid={method=>{c.setState(s=>({...s,paid:true}));c.notify('Paid by '+method+'. Receipt sent by SMS and email.');c.celebrate()}}/>})}/>):undefined}/></div>
  if (['Maintenance','Job marketplace','My work','Earnings'].includes(page)) {
    const list = page==='Earnings'?state.repairs.filter(r=>r.status==='Completed'):state.repairs.filter(r=>page==='Job marketplace'?r.status==='Open for quotes':page==='My work'?!['Reported','Open for quotes'].includes(r.status):true)
    return <div className="records">{list.map(r=>repairRow(c,r))}{!list.length&&<Empty text={page==='Earnings'?'No payouts released yet.':'Nothing to show here.'}/>}</div>
  }
  if (page==='Listing moderation') {
    const queue = state.listings.filter(l=>l.status==='Pending review')
    return <div className="records">{queue.map(l=><Row key={l.id} id={l.id} title={l.title} detail={l.kind+' · '+l.location+' · '+money(l.rent)} status={l.status} buttons={<><Btn label="Reject" onClick={()=>c.confirm('Reject listing','The owner can resubmit.','Reject',()=>{c.setState(s=>({...s,listings:s.listings.map(x=>x.id===l.id?{...x,status:'Rejected'}:x)}));c.notify('Listing rejected.')})}/><Btn primary label="Approve & publish" onClick={()=>c.confirm('Publish listing','It will appear in tenant search.','Publish',()=>{c.setState(s=>({...s,listings:s.listings.map(x=>x.id===l.id?{...x,status:'Published'}:x)}));c.notify('Listing published.')})}/></>}/>)}{!queue.length&&<Empty text="You’re all caught up. Nothing awaits review."/>}</div>
  }
  if (page==='Verification'||page==='Disputes') return <div className="records">{state.reviews.filter(r=>r.kind===(page==='Verification'?'Verification':'Dispute')).map(r=>{
    const decide = (label:string,status:string,primary:boolean) => <Btn key={label} primary={primary} label={label} onClick={()=>c.open({title:label,detail:r.detail,submit:label,fields:[{name:'reason',label:'Decision note',type:'textarea'}],run:form=>{c.setState(s=>({...s,reviews:s.reviews.map(x=>x.id===r.id?{...x,status,detail:x.detail+' · Decision: '+value(form,'reason')}:x)}));c.notify('Decision recorded.')}})}/>
    return <Row key={r.id} id={r.id+' · waiting '+r.age} title={r.title} detail={r.detail} status={r.status} buttons={r.status==='Pending'?<>{decide('Reject','Rejected',false)}{decide('Verify','Verified',true)}</>:r.status==='Open'?decide('Resolve case','Resolved',true):undefined}/>
  })}</div>
  if (page==='Reports') return <Reports/>
  return null
}
