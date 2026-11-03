export type Role = 'Tenant' | 'Investor' | 'Craftsman' | 'Admin'
export type Listing = { id: string; title: string; location: string; kind: string; rent: number; status: string; tone: number }
export type Application = { id: string; listingId: string; note: string; status: string }
export type Repair = { id: string; title: string; note: string; category: string; photo?: string; proof?: string; status: string; quote?: number }
export type Review = { id: string; title: string; detail: string; status: string; kind: string }
export type State = { listings: Listing[]; applications: Application[]; repairs: Repair[]; reviews: Review[]; paid: boolean }
export const initial: State = {
  listings: [
    {id:'PF-101', title:'Cinnamon Court', location:'Rajagiriya', kind:'Apartment', rent:85000, status:'Published', tone:0},
    {id:'PF-102', title:'The Fern Annex', location:'Nugegoda', kind:'Boarding unit', rent:32500, status:'Published', tone:1},
    {id:'PF-103', title:'Lakeview House', location:'Battaramulla', kind:'House', rent:125000, status:'Published', tone:2},
  ],
  applications:[{id:'APP-204',listingId:'PF-101',note:'Two occupants, looking to move in on 1 December.',status:'Submitted'}],
  repairs:[
    {id:'MNT-108',title:'Leaking kitchen tap',note:'The tap at Cinnamon Court, Unit 2B, drips even when fully closed.',category:'Plumbing',status:'Reported'},
    {id:'MNT-107',title:'Bedroom light fitting',note:'Replace the faulty ceiling light fitting at Cinnamon Court.',category:'Electrical',status:'Open for quotes'},
  ],
  reviews:[
    {id:'VER-031',title:'Nimal Perera',detail:'Investor onboarding · Identity and ownership evidence submitted',status:'Pending',kind:'Verification'},
    {id:'VER-032',title:'Kasun Silva',detail:'Craftsman onboarding · Trade credentials submitted',status:'Pending',kind:'Verification'},
    {id:'DSP-012',title:'Move-out deposit deduction',detail:'Tenant disputes the cleaning deduction. Both parties have submitted evidence.',status:'Open',kind:'Dispute'},
  ],
  paid:false,
}
export const people: Record<Role, string> = { Tenant:'Anjali Fernando',Investor:'Nimal Perera',Craftsman:'Kasun Silva',Admin:'Maya Jayasinghe' }
export const navigation: Record<Role,string[]> = {
  Tenant:['Overview','Find a rental','Applications','My tenancy','Rent & receipts','Maintenance'],
  Investor:['Overview','Properties','Applications','Agreements','Rent ledger','Maintenance'],
  Craftsman:['Overview','Job marketplace','My work','Earnings'],
  Admin:['Overview','Verification','Listing moderation','Disputes','Reports'],
}
export const money = (amount:number) => 'LKR ' + new Intl.NumberFormat('en-LK').format(amount)
export const uid = (prefix:string) => prefix + '-' + Array.from(crypto.getRandomValues(new Uint8Array(4)), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
