# Bio Rider Co-Creation Map - Detailed Application Description

---

## English

### Overview

Bio Rider Co-Creation Map is a web-based participatory mapping platform designed for the Uzice-Sevojno region in Serbia. It enables citizens, local organizations, and stakeholders to collaboratively build a shared geographic knowledge base - marking important locations, sharing observations, discussing community needs, and making collective decisions about local resources and infrastructure.

The application combines modern web technologies with principles of participatory democracy and civic engagement, creating a digital commons where every voice can be heard.

### Purpose

The platform serves the Bio Rider initiative (part of the EIT-funded Green Mobility program) by providing:

1. **Community Knowledge Mapping** - Citizens mark and describe locations relevant to sustainable mobility, eco-tourism, cycling infrastructure, and environmental points of interest
2. **Participatory Decision-Making** - The built-in deliberation system allows structured community discussions about each location, following democratic deliberation phases
3. **Data Collection & Export** - All community-generated data can be exported (CSV, GeoJSON) for use in urban planning, research, and grant applications
4. **Community Engagement** - Gamification elements (ratings, verifications, notifications) encourage ongoing participation

### Key Features

#### Interactive Map
The map is built on Leaflet/OpenStreetMap and centered on the Uzice-Sevojno area. Users see markers for all community-added locations. Markers cluster automatically when zoomed out and expand when zoomed in. Each marker shows a preview tooltip on hover and a detailed popup on click with description, rating, verification status, and action buttons.

#### Location Management
Any logged-in user can add locations by clicking on the map. Each location supports:
- Name and bilingual description (Serbian + English) with Markdown formatting
- Image uploads (JPG, PNG, GIF, WebP up to 5MB)
- Document uploads (PDF, DOC, DOCX up to 20MB) with text extraction for search
- Geographic coordinates (adjustable by dragging the marker)

#### Comments & Ratings
Users can rate locations on a 1-5 star scale and leave optional comments. The average rating is displayed on each location's popup. This creates a community quality signal for the most valued locations.

#### Location Verification
Any user can "verify" a location, confirming it exists and is accurately described. When a location receives 3 or more verifications, it earns a green verified badge - a trust signal from the community.

#### Deliberative Discussions
Inspired by deliberation platforms like Pol.is and Loomio, each location can host structured discussions with 5 phases:
1. **Problem Identification** - Community members identify problems or opportunities
2. **Proposals** - Users submit proposals to address identified issues
3. **Argumentation** - Arguments for and against proposals are debated
4. **Consensus Building** - The community works toward agreement
5. **Closed** - Discussion concludes with documented outcomes

Each entry can receive up/down votes. Admins advance discussions through phases.

#### Routes & Paths
Users can create routes (cycling, walking, hiking) by clicking waypoints on the map. The system automatically calculates distances using the Haversine formula. Routes are displayed as colored polylines with type-specific styling (dashed for hiking, solid for cycling/walking).

#### Activity Heatmap
A togglable heatmap layer visualizes location density using a green-to-red gradient. Areas with many locations appear as hot spots, helping identify areas of high community interest.

#### Time Machine
A unique feature that lets users explore how the map evolved over time. A slider moves through months, showing only locations that existed at each point. A play/pause button animates the progression automatically.

#### Statistics Dashboard
A dedicated page with interactive Recharts visualizations:
- Animated counters for total locations, active users, and monthly additions
- Bar chart showing locations per user
- Area chart showing cumulative growth over time
- Pie chart showing user contribution distribution

#### Notifications
A bell icon in the header shows unread notification count. Users receive notifications when new locations, comments, verifications, or discussions are created. The system polls for updates every 30 seconds.

#### Onboarding Tour
First-time users see an interactive walkthrough (React Joyride) that highlights key UI elements: search, locations list, layers menu, export, and the add location button. The tour can be skipped and won't show again.

#### Search
Full-text search queries locations by name, description, and even content extracted from uploaded documents. Results highlight matching text and show where matches were found (location, document, or both).

#### Export
All location data can be downloaded as:
- **CSV** - Spreadsheet-compatible format with name, description, coordinates, and metadata
- **GeoJSON** - Standard geographic format compatible with QGIS, ArcGIS, and other GIS tools

### Technical Architecture

The frontend is a single-page application built with React 18, TypeScript, and Vite. Tailwind CSS provides utility-first styling. The map uses react-leaflet with plugin extensions (clustering, heatmap). Framer Motion handles animations. Recharts powers the statistics visualizations.

The backend is Supabase (hosted PostgreSQL with REST API and Storage). Row Level Security is disabled in favor of localStorage-based authentication for simplicity. The database schema includes 10 tables covering locations, files, comments, verifications, routes, deliberations, and notifications.

Internationalization is handled by react-i18next with complete English and Serbian translations.

---

## Srpski

### Pregled

Bio Rider Mapa Ko-kreiranja je web platforma za participativno mapiranje dizajnirana za region Uzice-Sevojno u Srbiji. Omogucava gradjanima, lokalnim organizacijama i zainteresovanim stranama da kolaborativno grade zajednicku geografsku bazu znanja - oznacavaju vazne lokacije, dele zapazanja, diskutuju o potrebama zajednice i donose kolektivne odluke o lokalnim resursima i infrastrukturi.

Aplikacija kombinuje moderne web tehnologije sa principima participativne demokratije i gradjanskog angazovanja, stvarajuci digitalni zajednicki prostor gde svaki glas moze biti cuven.

### Svrha

Platforma sluzi Bio Rider inicijativi (deo EIT-finansiranog Green Mobility programa) pruzajuci:

1. **Mapiranje Znanja Zajednice** - Gradjani oznacavaju i opisuju lokacije relevantne za odrzivi transport, eko-turizam, biciklisticku infrastrukturu i ekoloske tacke od interesa
2. **Participativno Donosenje Odluka** - Ugradjeni sistem deliberacije omogucava strukturirane diskusije zajednice o svakoj lokaciji, prateci demokratske faze deliberacije
3. **Prikupljanje i Export Podataka** - Svi podaci koje zajednica generiše mogu se exportovati (CSV, GeoJSON) za koriscenje u urbanistickom planiranju, istrazivanju i prijavama za grantove
4. **Angazovanje Zajednice** - Elementi gamifikacije (ocene, verifikacije, obavestenja) podsticuangazovanje

### Kljucne Funkcionalnosti

#### Interaktivna Mapa
Mapa je izgradjena na Leaflet/OpenStreetMap platformi i centrirana na oblast Uzice-Sevojno. Korisnici vide markere za sve lokacije koje je zajednica dodala. Markeri se automatski grupisu (klasteruju) kada je mapa udaljena i rasijavaju kada se priblizi. Svaki marker prikazuje tooltip pri prelasku misem i detaljan popup pri kliku sa opisom, ocenom, statusom verifikacije i dugmadima za akcije.

#### Upravljanje Lokacijama
Svaki prijavljeni korisnik moze dodati lokacije klikom na mapu. Svaka lokacija podrzava:
- Naziv i dvojezicni opis (srpski + engleski) sa Markdown formatiranjem
- Upload slika (JPG, PNG, GIF, WebP do 5MB)
- Upload dokumenata (PDF, DOC, DOCX do 20MB) sa ekstrakcijom teksta za pretragu
- Geografske koordinate (podesive prevlacenjem markera)

#### Komentari i Ocene
Korisnici mogu oceniti lokacije na skali od 1 do 5 zvezdica i ostaviti opcioni komentar. Prosecna ocena se prikazuje na popup-u svake lokacije. Ovo stvara signal kvaliteta zajednice za najvrednije lokacije.

#### Verifikacija Lokacija
Svaki korisnik moze "verifikovati" lokaciju, potvrdjavajuci da postoji i da je tacno opisana. Kada lokacija dobije 3 ili vise verifikacija, dobija zelenu znacku verifikacije - signal poverenja od zajednice.

#### Deliberativne Diskusije
Inspirisane platformama za deliberaciju kao sto su Pol.is i Loomio, svaka lokacija moze ugostiti strukturirane diskusije sa 5 faza:
1. **Identifikacija Problema** - Clanovi zajednice identifikuju probleme ili mogucnosti
2. **Predlozi** - Korisnici podnose predloge za resavanje identifikovanih pitanja
3. **Argumentacija** - Argumenti za i protiv predloga se debatuju
4. **Gradnja Konsenzusa** - Zajednica radi na postizanju dogovora
5. **Zatvoreno** - Diskusija se zakljucuje sa dokumentovanim ishodima

Svaki unos moze dobiti glasove za/protiv. Admini pomera diskusije kroz faze.

#### Rute i Putanje
Korisnici mogu kreirati rute (biciklizam, setnja, planinarenje) klikom na tacke na mapi. Sistem automatski izracunava udaljenosti koristeci Haversine formulu. Rute se prikazuju kao obojene poliline sa stilizacijom specificnom za tip (isprekidane za planinarenje, pune za biciklizam/setnju).

#### Heatmapa Aktivnosti
Preklopni sloj heatmape vizualizuje gustinu lokacija koristeci zeleno-crveni gradijent. Oblasti sa mnogo lokacija se pojavljuju kao vruce tacke, pomazuci u identifikaciji oblasti visokog interesa zajednice.

#### Vremeplov
Jedinstvena funkcionalnost koja korisnicima omogucava da istraze kako se mapa razvijala tokom vremena. Klizac se krece kroz mesece, prikazujuci samo lokacije koje su postojale u svakom trenutku. Dugme za reprodukciju/pauzu automatski animira napredovanje.

#### Statisticki Dashboard
Posebna stranica sa interaktivnim Recharts vizualizacijama:
- Animirani brojaci za ukupne lokacije, aktivne korisnike i mesecne dodatke
- Stupicasti grafikon koji prikazuje lokacije po korisniku
- Grafikon oblasti koji prikazuje kumulativni rast tokom vremena
- Tortni grafikon koji prikazuje distribuciju doprinosa korisnika

#### Obavestenja
Ikona zvonceta u zaglavlju prikazuje broj neprocitanih obavestenja. Korisnici dobijaju obavestenja kada se kreiraju nove lokacije, komentari, verifikacije ili diskusije. Sistem proverava azuriranja svakih 30 sekundi.

#### Onboarding Tura
Korisnici koji prvi put koriste aplikaciju vide interaktivni vodic (React Joyride) koji istice kljucne elemente interfejsa: pretragu, listu lokacija, meni slojeva, export i dugme za dodavanje lokacije. Tura se moze preskociti i nece se ponovo prikazati.

#### Pretraga
Full-text pretraga pretrazuje lokacije po nazivu, opisu, pa cak i sadrzaju ekstrahovanom iz uploadovanih dokumenata. Rezultati isticu tekst koji se poklapa i prikazuju gde su poklapanja pronadjena (lokacija, dokument ili oba).

#### Export Podataka
Svi podaci o lokacijama se mogu preuzeti kao:
- **CSV** - Format kompatibilan sa tabelama sa nazivom, opisom, koordinatama i metapodacima
- **GeoJSON** - Standardni geografski format kompatibilan sa QGIS, ArcGIS i drugim GIS alatima

### Tehnicka Arhitektura

Frontend je single-page aplikacija izgradjena sa React 18, TypeScript i Vite. Tailwind CSS pruza utility-first stilizaciju. Mapa koristi react-leaflet sa plugin prosirenjima (klasterovanje, heatmapa). Framer Motion upravlja animacijama. Recharts pogoni vizualizacije statistike.

Backend je Supabase (hostovani PostgreSQL sa REST API-jem i Storage-om). Row Level Security je iskljucen u korist localStorage autentifikacije radi jednostavnosti. Sema baze podataka ukljucuje 10 tabela koje pokrivaju lokacije, fajlove, komentare, verifikacije, rute, deliberacije i obavestenja.

Internacionalizacija se upravlja putem react-i18next sa kompletnim prevodima na engleskom i srpskom jeziku.
