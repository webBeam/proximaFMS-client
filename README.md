# ProximaFMS client demo

A React and TypeScript prototype for rental and facility management in Sri Lanka. The demo includes Market Day, Papaya, and Lagoon palettes, with Manrope for interface text and Space Grotesk for headings. Use the palette picker in the top bar to switch instantly. Your selection is saved in the current browser. Fonts and stock photographs are bundled with the build. Tenant navigation runs across the top. Investor, Craftsman, and Admin use a sidebar on desktop and a stacked menu on small screens.

The landing page includes a full-width property photo carousel, neighbourhood shortcuts, featured listings and a working rental search.

## Start the demo

1. Extract the ZIP and open a terminal in the `proxima-fms` folder.
2. Install Node.js 22 LTS or newer.
3. Run `npm ci`, then `npm run dev`.
4. Open the local address printed by Vite and use the landing page to browse rentals or open a workspace. Use **Switch role** in a workspace to move between roles, or **Home** to return to the landing page. The Admin workspace is available in the landing page footer.

A compiled build is included in `dist/`. To run it without installing npm packages, use `python -m http.server 8080 --directory dist` from the project folder and open http://localhost:8080. For a fresh build, run `npm run build`.

## Client walkthrough

1. **Publish a listing.** As Investor, go to **Properties → New listing**. Switch to Admin and approve it under **Listing moderation**. Switch to Tenant and search for it in **Find a rental**.
2. **Move an application to an agreement.** In Tenant, view the new property and submit an application. In Investor, open **Applications** and approve it. Switch to Tenant to reserve it, Investor to send the agreement, Tenant to sign it, and Investor to countersign it. Return to **My tenancy** to see its status.
3. **Report a repair and complete a job.** As Tenant, open **Maintenance** and report a repair or use the seeded leaking tap. In Investor, publish the service job. In Craftsman, quote for it in **Job marketplace**. In Investor, award and fund the job. In Craftsman, use **My work** to start and submit the completed job. In Tenant, confirm the repair. In Investor, approve the demo payout, then return to Craftsman **Earnings**.
4. **Show rent and admin operations.** As Tenant, simulate payment under **Rent & receipts**, then view the receipt. As Investor, check **Rent ledger**. As Admin, open **Verification**, **Disputes**, and **Reports** to review the sample queues.

## Demo scope

This prototype covers the four primary SRS roles and selected use cases for listings, applications, agreements, rent, repairs, verification, moderation, disputes, and reporting. It uses an English interface with LKR sample amounts. Users, records, payments, payouts, and signatures are simulated. The sample agreement and invoice illustrate separate scenarios. The role picker is for presentation, with no authentication or backend integration.

Data and optional repair images are stored in the current browser. Use **Reset demo data** in the sidebar before a new walkthrough.

## Photo credits

These Pexels stock photos illustrate the fictional demo listings.

- [Modern Tropical Home Exterior with Palm Trees](https://www.pexels.com/photo/modern-tropical-home-exterior-with-palm-trees-35361402/)
- [Orange and White Apartment Building](https://www.pexels.com/photo/orange-and-white-apartment-building-6117859/)
- [Exterior of residential house near lush palms](https://www.pexels.com/photo/exterior-of-residential-house-near-lush-palms-6416122/)
