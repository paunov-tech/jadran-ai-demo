// ═══════════════════════════════════════════════════════════
// JADRAN.AI — Partner / Affiliate Config
// Dodaj novog partnera: kopiraj template na dnu, popuni podatke,
// dodaj token u AFFILIATE_TOKENS i koordinate u AFFILIATE_COORDS.
// ═══════════════════════════════════════════════════════════

// ─── PRISTUPNI TOKENI (URL ?tk=) ────────────────────────────
export const AFFILIATE_TOKENS = {
  "blackjack":     "sial2026",
  "eufemija":      "rov2026",   // Konoba Sv. Eufemija, Rovinj — demo
};

// ─── GPS KOORDINATE (za kiosk geolokaciju) ──────────────────
export const AFFILIATE_COORDS = {
  "blackjack":     [44.7534, 14.7835, "Rab"],
  "eufemija":      [45.0812, 13.6388, "Rovinj"],
};

// ─── STATS PIN (za analytics ploču ?stats=X&pin=Y) ──────────
export const AFFILIATE_PINS = {
  "blackjack":     "bj2026",
  "eufemija":      "ev2026",
};

// ─── PARTNER DATA ────────────────────────────────────────────
export const AFFILIATE_DATA = {

  // ════════════════════════════════════════════════
  // 🃏 BLACK JACK — Gurman House, Palit, Rab
  // ════════════════════════════════════════════════
  blackjack: {
    name: "Black Jack", emoji: "🃏", color: "#0ea5e9",
    city: "Rab", region: "Kvarner",
    address: { de:"Palit 315, Insel Rab, Kroatien", en:"Palit 315, Rab Island, Croatia", hr:"Palit 315, otok Rab, Hrvatska", it:"Palit 315, Isola di Rab, Croazia" },
    tagline: { de:"Gurman House — Ihr Genussparadies auf der Insel Rab", en:"Gurman House — Your gourmet paradise on Rab Island", hr:"Gurman House — Vaš gurmanski raj na otoku Rabu", it:"Gurman House — Il vostro paradiso gourmet sull'isola di Rab" },
    desc: {
      de: "Das Gurman House Black Jack liegt an der Hauptstraße von Rab nach Palit, direkt am Meer. Bekannt für exzellente Argentino-Steaks, Ćevapi mit Räucherkäse und die beste Pizza auf der Insel. Gemütliche Terrasse mit Meerblick — ein Geheimtipp abseits der Touristenpfade. Apartment-Zimmer mit Klimaanlage, voll ausgestatteter Küche und kostenlosem Parkplatz direkt am Haus.",
      en: "Gurman House Black Jack sits on the main road from Rab to Palit, right by the sea. Famous for excellent Argentino steaks, ćevapi stuffed with smoked cheese, and the best pizza on the island. Cozy terrace with sea views — a hidden gem off the beaten path. Apartment rooms with air conditioning, fully equipped kitchen, and free parking on site.",
      hr: "Gurman House Black Jack nalazi se na glavnoj cesti od Raba prema Palitu, tik uz more. Poznat po izvrsnim argentinskim steakovima, ćevapima s dimljenim sirom i najboljoj pizzi na otoku. Ugodna terasa s pogledom na more — skriveni dragulj izvan turističkih ruta. Apartmani s klimatizacijom, opremljenom kuhinjom i besplatnim parkingom.",
      it: "Gurman House Black Jack si trova sulla strada principale da Rab a Palit, proprio sul mare. Famoso per gli eccellenti steak argentini, ćevapi con formaggio affumicato e la migliore pizza dell'isola. Terrazza accogliente con vista mare — una gemma nascosta fuori dai sentieri turistici.",
    },
    features: {
      de: ["🥩 Argentino Steaks & Grill","🧀 Ćevapi mit Räucherkäse","🍕 Beste Pizza auf Rab","🌊 Terrasse direkt am Meer","🅿️ Kostenloser Parkplatz","❄️ Klimaanlage","📶 Gratis WLAN","🍳 Voll ausgestattete Küche"],
      en: ["🥩 Argentino steaks & grill","🧀 Ćevapi with smoked cheese","🍕 Best pizza on Rab","🌊 Seaside terrace","🅿️ Free parking","❄️ Air conditioning","📶 Free WiFi","🍳 Fully equipped kitchen"],
      hr: ["🥩 Argentinski steakovi & roštilj","🧀 Ćevapi s dimljenim sirom","🍕 Najbolja pizza na Rabu","🌊 Terasa uz more","🅿️ Parkiranje gratis","❄️ Klimatizacija","📶 WiFi gratis","🍳 Opremljena kuhinja"],
      it: ["🥩 Steak argentini & griglia","🧀 Ćevapi con formaggio affumicato","🍕 La migliore pizza di Rab","🌊 Terrazza sul mare","🅿️ Parcheggio gratuito","❄️ Aria condizionata","📶 WiFi gratuito","🍳 Cucina attrezzata"],
    },
    poi: [
      { icon:"🏛️", de:"Altstadt Rab & 4 Glockentürme",  en:"Rab Old Town & 4 Bell Towers",   hr:"Stari grad Rab & 4 zvonika",     it:"Centro storico di Rab & 4 campanili",   dist:"2 km" },
      { icon:"⚔️", de:"Rabska Fjera (25-27. Juli)",      en:"Rabska Fjera (Jul 25-27)",        hr:"Rabska Fjera (25-27. srpnja)",     it:"Rabska Fjera (25-27 luglio)",           dist:"2 km" },
      { icon:"🏖️", de:"Strand Sv. Ivan",                 en:"Sveti Ivan Beach",                hr:"Plaža Sv. Ivan",                    it:"Spiaggia Sv. Ivan",                     dist:"1.3 km" },
      { icon:"🏖️", de:"Paradiesstrand Lopar",            en:"Paradise Beach Lopar",            hr:"Rajska plaža Lopar",                it:"Spiaggia Paradiso Lopar",               dist:"15 km" },
      { icon:"🌲", de:"Park Komrčar (8.3 ha)",           en:"Komrčar Park (8.3 ha)",           hr:"Park Komrčar (8.3 ha)",             it:"Parco Komrčar (8.3 ha)",                dist:"1.5 km" },
      { icon:"⛵", de:"Marina Rab (200 Plätze)",         en:"Marina Rab (200 berths)",         hr:"Marina Rab (200 vezova)",           it:"Marina Rab (200 posti)",                dist:"2.2 km" },
      { icon:"🏝️", de:"Goli Otok (Kroat. Alcatraz)",     en:"Goli Otok (Croatian Alcatraz)",   hr:"Goli Otok",                         it:"Goli Otok (Alcatraz croata)",           dist:"5 km" },
      { icon:"🍰", de:"Haus der Rab-Torte",              en:"House of Rab Cake",               hr:"Kuća rapske torte",                 it:"Casa della torta di Rab",               dist:"2 km" },
    ],
    highlight: {
      de: "🎪 Rabska Fjera — Das größte mittelalterliche Festival Kroatiens (seit 1364). Jedes Jahr 25.-27. Juli: Ritterspiele, Kostümumzüge, 700+ Teilnehmer, Armbrust-Turniere, mittelalterliche Handwerkskunst und Feuerwerk im Hafen von Rab.",
      en: "🎪 Rabska Fjera — Croatia's largest medieval festival (since 1364). Every year Jul 25-27: knight tournaments, costume parades, 700+ participants, crossbow competitions, medieval crafts and fireworks in Rab harbour.",
      hr: "🎪 Rabska Fjera — Najveći srednjovjekovni festival u Hrvatskoj (od 1364). Svake godine 25.-27. srpnja: viteški turniri, povorke u kostimima, 700+ sudionika, natjecanja samostreličara i vatromet u luci Rab.",
      it: "🎪 Rabska Fjera — Il più grande festival medievale della Croazia (dal 1364). Ogni anno 25-27 luglio: tornei cavallereschi, sfilate in costume, 700+ partecipanti, gare di balestra e fuochi d'artificio nel porto di Rab.",
    },
    excursions: [
      { emoji:"🚢", de:"Bootstouren ab Rab",        en:"Boat Tours from Rab",       hr:"Ture brodom iz Raba",        it:"Tour in barca da Rab",        gyg:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=boat+tour",    viator:"https://www.viator.com/searchResults/all?text=Rab+boat+tour&pid=P00292197" },
      { emoji:"🤿", de:"Schnorcheln & Tauchen",     en:"Diving & Snorkeling",       hr:"Ronjenje i snorkeling",      it:"Immersioni e snorkeling",      gyg:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=diving",       viator:"https://www.viator.com/searchResults/all?text=Rab+diving&pid=P00292197" },
      { emoji:"🛶", de:"Kajak & SUP",               en:"Kayak & SUP",               hr:"Kajak & SUP",                it:"Kayak & SUP",                  gyg:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=kayak",        viator:"https://www.viator.com/searchResults/all?text=Rab+kayak&pid=P00292197" },
      { emoji:"🏝️", de:"Insel-Hopping (Goli Otok)", en:"Island Hopping",            hr:"Otočki obilazak",            it:"Island Hopping",               gyg:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=island+hopping", viator:"https://www.viator.com/searchResults/all?text=Rab+island+hopping&pid=P00292197" },
      { emoji:"⚔️", de:"Rabska Fjera Stadtführung",  en:"Rabska Fjera Town Walk",    hr:"Rabska Fjera šetnja gradom", it:"Passeggiata Rabska Fjera",     gyg:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=rab+walking+tour", viator:"https://www.viator.com/searchResults/all?text=Rab+walking+tour&pid=P00292197" },
    ],
    booking: "https://www.booking.com/searchresults.html?ss=Rab%2C+Croatia&aid=101704203",
    heroImg: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80",
    propImg: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    phone: "+385 51 724 522",
    whatsapp: "38551724522",
    droneVideoId: null,
    matterportId: null,
    hours: { hr:"Pon–Ned 12:00–23:00", de:"Mo–So 12:00–23:00", en:"Mon–Sun 12:00–23:00", it:"Lun–Dom 12:00–23:00" },
    rating: 4.7,
    reviewCount: 127,
    gallery: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    ],
    testimonials: [
      { name:"Klaus M.", flag:"🇩🇪", rating:5, text:{ de:"Das beste Steak auf der Insel! Die Terrasse mit Meerblick ist einfach traumhaft — wir kommen definitiv wieder.", en:"Best steak on the island! The sea-view terrace is simply dreamy — we'll definitely be back.", hr:"Najbolji steak na otoku! Terasa s pogledom na more je fantastična — svakako se vraćamo.", it:"La migliore bistecca sull'isola! La terrazza con vista mare è semplicemente meravigliosa." } },
      { name:"Sarah B.", flag:"🇬🇧", rating:5, text:{ de:"Fantastische Pizzen und unglaublich freundliches Personal. Der Ćevapi mit Räucherkäse ist ein absolutes Muss!", en:"Fantastic pizzas and incredibly friendly staff. The ćevapi with smoked cheese is an absolute must!", hr:"Fantastične pizze i prijazno osoblje. Ćevapi s dimljenim sirom su apsolutno obavezni!", it:"Pizze fantastiche e personale incredibilmente gentile. Il ćevapi con formaggio affumicato è un must!" } },
      { name:"Marta K.", flag:"🇵🇱", rating:5, text:{ de:"Perfekter Urlaubsabend — Fischplatte war köstlich. Gemütlich, günstig, authentisch kroatisch.", en:"Perfect holiday evening — the seafood platter was delicious. Cosy, affordable, authentically Croatian.", hr:"Savršena ljetna večer — riblje jelo je bilo izvrsno. Ugodna, pristupačna, autentično hrvatska kuhinja.", it:"Serata vacanziera perfetta — il piatto di pesce era delizioso. Accogliente, economico, autenticamente croato." } },
    ],
    dailySpecials: [
      { day:0, emoji:"🥩", hr:"Nedjeljna goveđa plata (za 2)", de:"Sonntagsrinderplatte (für 2)", en:"Sunday beef platter (for 2)", it:"Piatto di manzo domenicale (x2)", price:32 },
      { day:1, emoji:"🐟", hr:"Riba dana s prilogom", de:"Fisch des Tages mit Beilage", en:"Fish of the day with side", it:"Pesce del giorno con contorno", price:19 },
      { day:2, emoji:"🍕", hr:"Pizza + salata + piće = 15€", de:"Pizza + Salat + Getränk = 15€", en:"Pizza + salad + drink = 15€", it:"Pizza + insalata + bevanda = 15€", price:15 },
      { day:3, emoji:"🐙", hr:"Pečena hobotnica + crni rižot", de:"Gebackener Krake + schwarzes Risotto", en:"Baked octopus + black risotto", it:"Polpo al forno + risotto nero", price:24 },
      { day:4, emoji:"🌭", hr:"Ćevapi večer — 10 kom + prilog", de:"Ćevapi-Abend — 10 Stk + Beilage", en:"Ćevapi night — 10 pcs + side", it:"Serata ćevapi — 10 pz + contorno", price:18 },
      { day:5, emoji:"🦞", hr:"Jadranski tanjur za 2 — sve iz mora", de:"Adriatischer Teller für 2 — alles aus dem Meer", en:"Adriatic platter for 2 — all from the sea", it:"Piatto adriatico x2 — tutto dal mare", price:38 },
      { day:6, emoji:"🔥", hr:"Subotnji roštilj mješano (za 2)", de:"Samstag-Grillplatte (für 2)", en:"Saturday BBQ mixed grill (for 2)", it:"Grigliata mista del sabato (x2)", price:36 },
    ],
    rooms: [
      { id:"studio", emoji:"🛏️", name:{ hr:"Studio apartman", de:"Studio-Apartment", en:"Studio apartment", it:"Studio appartamento" }, guests:2, beds:1, sqm:22, img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80", amenities:{ hr:["❄️ Klima","📶 WiFi","🍳 Kuhinja","🚿 Kupaonica","🅿️ Parking"], de:["❄️ Klimaanlage","📶 WLAN","🍳 Küche","🚿 Badezimmer","🅿️ Parkplatz"], en:["❄️ A/C","📶 WiFi","🍳 Kitchen","🚿 Bathroom","🅿️ Parking"], it:["❄️ Aria cond.","📶 WiFi","🍳 Cucina","🚿 Bagno","🅿️ Parcheggio"] }, view:{ hr:"Pogled na vrt", de:"Gartenblick", en:"Garden view", it:"Vista giardino" }, priceFrom:65, bookingNote:{ hr:"min. 3 noći", de:"min. 3 Nächte", en:"min. 3 nights", it:"min. 3 notti" } },
      { id:"apt_a", emoji:"🏠", name:{ hr:"Apartman A — za 4 osobe", de:"Apartment A — für 4 Personen", en:"Apartment A — for 4 guests", it:"Appartamento A — per 4 persone" }, guests:4, beds:2, sqm:42, img:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80", amenities:{ hr:["❄️ Klima","📶 WiFi","🍳 Opremljena kuhinja","🛁 Kupaonica","🅿️ Parking","🌅 Pogled na more"], de:["❄️ Klimaanlage","📶 WLAN","🍳 Voll ausgest. Küche","🛁 Badezimmer","🅿️ Parkplatz","🌅 Meerblick"], en:["❄️ A/C","📶 WiFi","🍳 Fully equipped kitchen","🛁 Bathroom","🅿️ Parking","🌅 Sea view"], it:["❄️ Aria cond.","📶 WiFi","🍳 Cucina attrezzata","🛁 Bagno","🅿️ Parcheggio","🌅 Vista mare"] }, view:{ hr:"Pogled na more", de:"Meerblick", en:"Sea view", it:"Vista mare" }, priceFrom:95, bookingNote:{ hr:"min. 3 noći", de:"min. 3 Nächte", en:"min. 3 nights", it:"min. 3 notti" } },
      { id:"apt_b", emoji:"🏡", name:{ hr:"Apartman B — za 6 osoba", de:"Apartment B — für 6 Personen", en:"Apartment B — for 6 guests", it:"Appartamento B — per 6 persone" }, guests:6, beds:3, sqm:65, img:"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=600&q=80", amenities:{ hr:["❄️ Klima","📶 WiFi","🍳 Opremljena kuhinja","🛁 2 kupaonice","🅿️ Parking","🌅 Pogled na more","🏊 Terasa"], de:["❄️ Klimaanlage","📶 WLAN","🍳 Voll ausgest. Küche","🛁 2 Badezimmer","🅿️ Parkplatz","🌅 Meerblick","🏊 Terrasse"], en:["❄️ A/C","📶 WiFi","🍳 Fully equipped kitchen","🛁 2 bathrooms","🅿️ Parking","🌅 Sea view","🏊 Terrace"], it:["❄️ Aria cond.","📶 WiFi","🍳 Cucina attrezzata","🛁 2 bagni","🅿️ Parcheggio","🌅 Vista mare","🏊 Terrazza"] }, view:{ hr:"Panoramski pogled na more", de:"Panorama-Meerblick", en:"Panoramic sea view", it:"Vista panoramica sul mare" }, priceFrom:130, bookingNote:{ hr:"min. 5 noći ljeti", de:"min. 5 Nächte im Sommer", en:"min. 5 nights in summer", it:"min. 5 notti in estate" } },
    ],
    menu: [
      { section:{ hr:"Predjela", de:"Vorspeisen", en:"Starters", it:"Antipasti" }, items:[
        { emoji:"🥩", name:{ hr:"Dalmatinski pršut", de:"Dalmatinischer Pršut", en:"Dalmatian prosciutto", it:"Prosciutto dalmata" }, desc:{ hr:"Domaći suhomesnati pršut, masline, kapari, maslinovo ulje s Raba", de:"Hausgemachter Trockenschinken, Oliven, Kapern, Rab-Olivenöl", en:"Home-cured prosciutto, olives, capers, Rab olive oil", it:"Prosciutto artigianale, olive, capperi, olio di Rab" }, price:12 },
        { emoji:"🍞", name:{ hr:"Bruschette s tartufima", de:"Bruschette mit Trüffel", en:"Truffle bruschette", it:"Bruschette al tartufo" }, desc:{ hr:"Prepečeni kruh s istarskom tartufnom kremom, cherry rajčicama i svježim bosiljkom", de:"Geröstetes Brot mit Trüffelcreme, Kirschtomaten und frischem Basilikum", en:"Toasted bread with truffle cream, cherry tomatoes and fresh basil", it:"Pane tostato con crema tartufata, pomodorini e basilico" }, price:9 },
        { emoji:"🦑", name:{ hr:"Kalamari na roštilju", de:"Gegrillte Kalamari", en:"Grilled calamari", it:"Calamari alla griglia" }, desc:{ hr:"Svježi jadranski kalamari s limunom, peršinom i maslinovim uljem", de:"Frische Adriatische Kalamari mit Zitrone, Petersilie und Olivenöl", en:"Fresh Adriatic calamari with lemon, parsley and olive oil", it:"Calamari adriatici freschi con limone, prezzemolo e olio" }, price:14 },
      ]},
      { section:{ hr:"S roštilja", de:"Vom Grill", en:"From the grill", it:"Dalla griglia" }, items:[
        { emoji:"🥩", name:{ hr:"Argentinski ribeye 300g", de:"Argentinisches Ribeye 300g", en:"Argentine ribeye 300g", it:"Ribeye argentino 300g" }, desc:{ hr:"Premium argentinsko meso na drvenom ugljenu, dimljeni maslac, rucola, pečeni češnjak", de:"Premium-Rindfleisch auf Holzkohle, Räucherbutter, Rucola, gerösteter Knoblauch", en:"Premium Argentine beef on charcoal, smoked butter, rocket, roasted garlic", it:"Manzo argentino alla brace, burro affumicato, rucola, aglio arrosto" }, price:28 },
        { emoji:"🌭", name:{ hr:"Ćevapi s dimljenim sirom (8 kom)", de:"Ćevapi mit Räucherkäse (8 Stk)", en:"Ćevapi with smoked cheese (8 pcs)", it:"Ćevapi con formaggio affumicato (8 pz)" }, desc:{ hr:"Domaći goveđi ćevapi, dimljeni sir iz Dalmatinske zagore, ajvar, svježi luk, somun", de:"Rindfleisch-Ćevapi, Räucherkäse aus dem Hinterland, Ajvar, Zwiebeln, Somun", en:"Beef ćevapi, smoked cheese from Dalmatian hinterland, ajvar, onion, somun bread", it:"Ćevapi di manzo, formaggio affumicato, ajvar, cipolla, pane somun" }, price:16 },
        { emoji:"🍖", name:{ hr:"Mješano meso s roštilja (za 2)", de:"Gemischte Grillplatte (für 2)", en:"Mixed grill platter (for 2)", it:"Piatto misto alla griglia (per 2)" }, desc:{ hr:"Ćevapi, pileći batak, svinjska rebra i povrće s roštilja", de:"Ćevapi, Hähnchenschenkel, Schweinerippchen und Grillgemüse", en:"Ćevapi, chicken thigh, pork ribs and grilled vegetables", it:"Ćevapi, coscia di pollo, costine di maiale e verdure grigliate" }, price:32 },
      ]},
      { section:{ hr:"Pizze", de:"Pizzen", en:"Pizzas", it:"Pizze" }, items:[
        { emoji:"🍕", name:{ hr:"Margherita", de:"Margherita", en:"Margherita", it:"Margherita" }, desc:{ hr:"San Marzano rajčica, buffalo mozzarella, svježi bosiljak, maslinovo ulje", de:"San-Marzano-Tomaten, Büffelmozzarella, Basilikum, Olivenöl", en:"San Marzano tomato, buffalo mozzarella, fresh basil, olive oil", it:"Pomodoro San Marzano, mozzarella di bufala, basilico, olio" }, price:11 },
        { emoji:"🃏", name:{ hr:"Pizza Black Jack", de:"Pizza Black Jack", en:"Pizza Black Jack", it:"Pizza Black Jack" }, desc:{ hr:"Dimljeni sir, ćevapčići, pepperoni, pečene paprike, češnjak ulje — naš signature", de:"Räucherkäse, Ćevapčići, Pepperoni, geröstete Paprika, Knoblauchöl — unser Signature", en:"Smoked cheese, ćevapčići, pepperoni, roasted peppers, garlic oil — our signature", it:"Formaggio affumicato, ćevapčići, pepperoni, peperoni arrosto — la nostra specialty" }, price:15 },
        { emoji:"🦐", name:{ hr:"Frutti di mare", de:"Frutti di mare", en:"Frutti di mare", it:"Frutti di mare" }, desc:{ hr:"Mješavina jadranskih plodova mora, rajčica, češnjak, peršin, maslinovo ulje", de:"Adriatische Meeresfrüchte, Tomaten, Knoblauch, Petersilie, Olivenöl", en:"Adriatic seafood medley, tomato, garlic, parsley, olive oil", it:"Frutti di mare adriatici, pomodoro, aglio, prezzemolo, olio" }, price:16 },
      ]},
      { section:{ hr:"Deserti", de:"Desserts", en:"Desserts", it:"Dolci" }, items:[
        { emoji:"🍮", name:{ hr:"Domaća rožata", de:"Hausgemachte Rožata", en:"Homemade rožata", it:"Rožata artigianale" }, desc:{ hr:"Tradicionalni dalmatinski krem karamel s ružinom vodicom i mjedom s Raba", de:"Dalmatinischer Crème caramel mit Rosenwasser und Rab-Honig", en:"Dalmatian crème caramel with rose water and Rab honey", it:"Crème caramel dalmata con acqua di rose e miele di Rab" }, price:7 },
        { emoji:"🍰", name:{ hr:"Torta od smokava", de:"Feigenkuchen", en:"Fig cake", it:"Torta di fichi" }, desc:{ hr:"Domaća torta s rabskim smokvama, mjedom i orasima — sezonski specijalitet", de:"Hausgemachter Kuchen mit Rab-Feigen, Honig und Walnüssen — Saisonspezialität", en:"Homemade cake with Rab figs, honey and walnuts — seasonal speciality", it:"Torta con fichi di Rab, miele e noci — stagionale" }, price:8 },
      ]},
      { section:{ hr:"Piće", de:"Getränke", en:"Drinks", it:"Bevande" }, items:[
        { emoji:"🍷", name:{ hr:"Domaće vino (čaša)", de:"Hauswein (Glas)", en:"House wine (glass)", it:"Vino della casa (calice)" }, desc:{ hr:"Bijelo ili crno, lokalni vinari s otoka Raba i Pelješca", de:"Weiß oder Rot, lokale Winzer der Insel Rab und Pelješac", en:"White or red, local winemakers from Rab and Pelješac", it:"Bianco o rosso, produttori locali di Rab e Pelješac" }, price:5 },
        { emoji:"🍺", name:{ hr:"Lokalno pivo", de:"Lokales Bier", en:"Local beer", it:"Birra locale" }, desc:{ hr:"Karlovačko ili Ožujsko, servirano u hladnom vrču", de:"Karlovačko oder Ožujsko, im kühlen Krug", en:"Karlovačko or Ožujsko, served in a chilled mug", it:"Karlovačko o Ožujsko, servita fredda" }, price:4 },
        { emoji:"🥤", name:{ hr:"Sok / Mineralna", de:"Saft / Mineralwasser", en:"Juice / Mineral water", it:"Succo / Acqua minerale" }, desc:{ hr:"Domaći voćni sok ili Jamnica mineralna voda", de:"Frisch gepresster Saft oder Jamnica Mineralwasser", en:"Freshly pressed juice or Jamnica mineral water", it:"Succo fresco o acqua minerale Jamnica" }, price:3 },
      ]},
    ],
  },

  // ════════════════════════════════════════════════
  // 🐟 KONOBA SV. EUFEMIJA — Rovinj  [DEMO PARTNER]
  // URL: jadran.ai/?kiosk=rovinj&affiliate=eufemija&tk=rov2026
  // ════════════════════════════════════════════════
  eufemija: {
    name: "Konoba Sv. Eufemija", emoji: "🐟", color: "#34d399",
    city: "Rovinj", region: "Istra",
    address: { hr:"Iza Kasarne 3, Rovinj", de:"Iza Kasarne 3, Rovinj", en:"Iza Kasarne 3, Rovinj", it:"Iza Kasarne 3, Rovigno" },
    tagline: { hr:"Svježa istrijska kuhinja u srcu starog grada", de:"Frische istrische Küche im Herzen der Altstadt", en:"Fresh Istrian cuisine in the heart of the old town", it:"Cucina istriana fresca nel cuore del centro storico" },
    desc: {
      hr:"Konoba Sv. Eufemija smještena je u srcu rovinjskog starog grada, tik ispod poznate crkve. Specijalizirana za svježe jadransko ribarstvo i istarske tartufe. Terase s pogledom na more, obiteljska atmosfera i vina lokalne konobe Kabola.",
      de:"Die Konoba Sv. Eufemija liegt im Herzen der Rovigno-Altstadt, direkt unterhalb der berühmten Kirche. Spezialisiert auf frischen adriatischen Fisch und istrische Trüffel. Terrassen mit Meerblick, familiäre Atmosphäre und Weine der lokalen Konoba Kabola.",
      en:"Konoba Sv. Eufemija sits in the heart of Rovinj's old town, just below the famous church. Specialising in fresh Adriatic fish and Istrian truffles. Sea-view terraces, family atmosphere and wines from local Konoba Kabola.",
      it:"La Konoba Sv. Eufemija si trova nel cuore del centro storico di Rovigno, proprio sotto la famosa chiesa. Specializzata in pesce adriatico fresco e tartufi istriani. Terrazze con vista mare, atmosfera familiare e vini della locale Konoba Kabola.",
    },
    features: {
      hr:["🐟 Svježa jadranska riba","🍄 Istarski tartufi","🍷 Lokalna vina Kabola","🌊 Terasa s pogledom na more","🏛️ U starom gradu Rovinja","👨‍🍳 Obiteljski recept od 1978."],
      de:["🐟 Frischer adriatischer Fisch","🍄 Istrische Trüffel","🍷 Lokale Kabola-Weine","🌊 Terrasse mit Meerblick","🏛️ In der Altstadt Rovigno","👨‍🍳 Familienrezept seit 1978"],
      en:["🐟 Fresh Adriatic fish","🍄 Istrian truffles","🍷 Local Kabola wines","🌊 Sea-view terrace","🏛️ In Rovinj old town","👨‍🍳 Family recipe since 1978"],
      it:["🐟 Pesce adriatico fresco","🍄 Tartufi istriani","🍷 Vini locali Kabola","🌊 Terrazza vista mare","🏛️ Nel centro storico di Rovigno","👨‍🍳 Ricetta di famiglia dal 1978"],
    },
    poi: [
      { icon:"⛪", de:"Kirche Sv. Eufemija",     en:"Church of St. Euphemia",   hr:"Crkva Sv. Eufemije",       it:"Chiesa di S. Eufemia",     dist:"50m" },
      { icon:"🏖️", de:"Strand Zlatni Rt",         en:"Zlatni Rt Beach",          hr:"Plaža Zlatni Rt",          it:"Spiaggia Zlatni Rt",       dist:"1.5 km" },
      { icon:"🎨", de:"Haus der Bauerbe",          en:"Heritage Museum",          hr:"Zavičajni muzej",          it:"Museo del Patrimonio",     dist:"300m" },
      { icon:"⛵", de:"Marina Rovinj",             en:"Marina Rovinj",            hr:"Marina Rovinj",            it:"Marina Rovinj",            dist:"800m" },
      { icon:"🏝️", de:"Inseln Crveni Otok",        en:"Crveni Otok Islands",      hr:"Crveni Otok",              it:"Isola Rossa",              dist:"1.5 km boot" },
    ],
    excursions: [
      { emoji:"🚢", de:"Bootstouren Rovinj", en:"Boat tours Rovinj", hr:"Ture brodom Rovinj", it:"Tour in barca Rovigno", gyg:"https://www.getyourguide.com/rovinj-l1965/?partner_id=9OEGOYI", viator:"https://www.viator.com/searchResults/all?text=Rovinj+boat+tour&pid=P00292197" },
      { emoji:"🍄", de:"Trüffel-Tour Istrien",  en:"Truffle tour Istria",  hr:"Tartufi tura Istra",  it:"Tour tartufi Istria",  gyg:"https://www.getyourguide.com/rovinj-l1965/?partner_id=9OEGOYI&q=truffle", viator:"https://www.viator.com/searchResults/all?text=Istria+truffle&pid=P00292197" },
      { emoji:"🚴", de:"E-Bike Küstentouren",   en:"E-bike coastal tour",  hr:"E-bike obala tura",   it:"Tour e-bike costiero",  gyg:"https://www.getyourguide.com/rovinj-l1965/?partner_id=9OEGOYI&q=bike", viator:"https://www.viator.com/searchResults/all?text=Rovinj+bike&pid=P00292197" },
    ],
    booking: "https://www.booking.com/searchresults.html?ss=Rovinj%2C+Croatia&aid=101704203",
    heroImg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80",
    propImg: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=80",
    phone: "+385 52 815 XXX",
    whatsapp: "38552815000",
    droneVideoId: null,
    matterportId: null,
    hours: { hr:"Uto–Ned 12:00–23:00 (pon. zatvoreno)", de:"Di–So 12:00–23:00 (Mo. geschlossen)", en:"Tue–Sun 12:00–23:00 (Mon. closed)", it:"Mar–Dom 12:00–23:00 (lun. chiuso)" },
    rating: 4.8,
    reviewCount: 203,
    gallery: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80",
      "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=80",
      "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&q=80",
    ],
    testimonials: [
      { name:"Peter W.", flag:"🇩🇪", rating:5, text:{ de:"Der frischeste Fisch, den ich je gegessen habe! Die Aussicht auf das Meer bei Sonnenuntergang war magisch.", en:"Freshest fish I've ever eaten! The sunset sea view was magical.", hr:"Najsvježija riba koju sam ikad jeo! Pogled na more pri zalasku sunca bio je magičan.", it:"Il pesce più fresco che abbia mai mangiato! La vista al tramonto era magica." } },
      { name:"Lisa M.", flag:"🇦🇹", rating:5, text:{ de:"Die Trüffel-Pasta war absolut göttlich. Wir kommen jedes Jahr nach Rovinj und immer hierher!", en:"The truffle pasta was absolutely divine. We come to Rovinj every year and always come here!", hr:"Tjestenina s tartufima bila je apsolutno božanstvena. Dolazimo svake godine u Rovinj i uvijek ovdje!", it:"La pasta al tartufo era assolutamente divina. Veniamo a Rovigno ogni anno e veniamo sempre qui!" } },
    ],
    dailySpecials: [
      { day:0, emoji:"🐟", hr:"Nedjeljni ribarski tanjur (za 2)", de:"Sonntags-Fischerplatte (für 2)", en:"Sunday fisherman's platter (for 2)", it:"Piatto del pescatore domenicale", price:44 },
      { day:1, emoji:"🍄", hr:"Tjestenina s tartufima + vino", de:"Trüffelnudeln + Wein", en:"Truffle pasta + wine", it:"Pasta al tartufo + vino", price:28 },
      { day:2, emoji:"🦞", hr:"Jastog na buzaru (sezonski)", de:"Hummer auf Buzara (saisonal)", en:"Lobster buzara (seasonal)", it:"Aragosta alla buzara (stagionale)", price:65 },
      { day:3, emoji:"🐙", hr:"Pečena hobotnica s krumpirom", de:"Gebackener Krake mit Kartoffeln", en:"Baked octopus with potatoes", it:"Polpo al forno con patate", price:26 },
      { day:4, emoji:"🍷", hr:"Degustacija istarskih vina uz platu", de:"Istrische Weinverkostung + Platte", en:"Istrian wine tasting + board", it:"Degustazione vini istriani + tagliere", price:35 },
      { day:5, emoji:"🐠", hr:"Riblja peka s povrćem (za 2)", de:"Fischpeka mit Gemüse (für 2)", en:"Fish peka with vegetables (for 2)", it:"Peka di pesce con verdure (x2)", price:52 },
      { day:6, emoji:"🎉", hr:"Gala seafood večera (za 2)", de:"Gala-Meeresfrüchte-Abend (für 2)", en:"Gala seafood dinner (for 2)", it:"Cena gala frutti di mare (x2)", price:75 },
    ],
    rooms: null, // nema smještaja — samo restoran
    menu: [
      { section:{ hr:"Predjela", de:"Vorspeisen", en:"Starters", it:"Antipasti" }, items:[
        { emoji:"🍄", name:{ hr:"Tartuf na kruhu", de:"Trüffel auf Brot", en:"Truffle on bread", it:"Tartufo su pane" }, desc:{ hr:"Svježi istarski tartuf, domaći kruh, maslinovo ulje Chiavalon", de:"Frischer istrischer Trüffel, hausgemachtes Brot, Chiavalon-Olivenöl", en:"Fresh Istrian truffle, homemade bread, Chiavalon olive oil", it:"Tartufo istriano fresco, pane fatto in casa, olio Chiavalon" }, price:18 },
        { emoji:"🦑", name:{ hr:"Brudet od sipe", de:"Tintenfisch-Brudet", en:"Cuttlefish brudet", it:"Brudet di seppie" }, desc:{ hr:"Domaći brudet, polenta, svježe začinsko bilje", de:"Hausgemachter Brudet, Polenta, frische Kräuter", en:"Homemade brudet, polenta, fresh herbs", it:"Brudet fatto in casa, polenta, erbe fresche" }, price:16 },
      ]},
      { section:{ hr:"Ribe i plodovi mora", de:"Fisch & Meeresfrüchte", en:"Fish & Seafood", it:"Pesce & Frutti di Mare" }, items:[
        { emoji:"🐟", name:{ hr:"Brancin na žaru", de:"Gegrillter Wolfsbarsch", en:"Grilled sea bass", it:"Branzino alla griglia" }, desc:{ hr:"Svježi jadranski brancin, maslinovo ulje, limun, kapari, mediteransko bilje", de:"Frischer adriatischer Wolfsbarsch, Olivenöl, Zitrone, Kapern, mediterrane Kräuter", en:"Fresh Adriatic sea bass, olive oil, lemon, capers, Mediterranean herbs", it:"Branzino adriatico fresco, olio, limone, capperi, erbe mediterranee" }, price:36 },
        { emoji:"🦞", name:{ hr:"Jastog na buzaru", de:"Hummer auf Buzara", en:"Lobster buzara", it:"Aragosta alla buzara" }, desc:{ hr:"Svježi jastog, domaći rajčičin umak, bijelo vino Malvazija, peršin", de:"Frischer Hummer, hausgemachte Tomatensauce, Malvasia-Weißwein, Petersilie", en:"Fresh lobster, homemade tomato sauce, Malvasia white wine, parsley", it:"Aragosta fresca, salsa pomodoro fatta in casa, Malvasia, prezzemolo" }, price:68 },
        { emoji:"🐙", name:{ hr:"Hobotnica ispod peke", de:"Krake unter der Peka", en:"Octopus under the peka", it:"Polpo sotto la peka" }, desc:{ hr:"Domaća hobotnica, krumpir, maslinovo ulje, rozmarije — priprema 2h unaprijed", de:"Hausgemachter Krake, Kartoffeln, Olivenöl, Rosmarin — 2h Voranmeldung", en:"Home-style octopus, potatoes, olive oil, rosemary — 2h advance notice", it:"Polpo casalingo, patate, olio, rosmarino — prenotare 2h prima" }, price:32 },
      ]},
      { section:{ hr:"Tjestenine & Rižoto", de:"Pasta & Risotto", en:"Pasta & Risotto", it:"Pasta & Risotto" }, items:[
        { emoji:"🍝", name:{ hr:"Fuži s tartufima", de:"Fuži mit Trüffel", en:"Fuži with truffle", it:"Fuži al tartufo" }, desc:{ hr:"Domaći fuži, crni istarski tartuf, pecorino, maslinovo ulje Chiavalon", de:"Hausgemachte Fuži, schwarzer istrischer Trüffel, Pecorino, Chiavalon-Olivenöl", en:"Homemade fuži pasta, black Istrian truffle, pecorino, Chiavalon olive oil", it:"Fuži fatti in casa, tartufo nero istriano, pecorino, olio Chiavalon" }, price:24 },
        { emoji:"🍚", name:{ hr:"Crni rižot od sipe", de:"Schwarzes Tintenfisch-Risotto", en:"Black cuttlefish risotto", it:"Risotto nero di seppia" }, desc:{ hr:"Istarski crni rižot, svježa sipa, bijelo vino, pecorino", de:"Istrisches schwarzes Risotto, frische Tintenfische, Weißwein, Pecorino", en:"Istrian black risotto, fresh cuttlefish, white wine, pecorino", it:"Risotto nero istriano, seppie fresche, vino bianco, pecorino" }, price:22 },
      ]},
      { section:{ hr:"Deserti", de:"Desserts", en:"Desserts", it:"Dolci" }, items:[
        { emoji:"🍯", name:{ hr:"Rožata s medom", de:"Rožata mit Honig", en:"Rožata with honey", it:"Rožata al miele" }, desc:{ hr:"Tradicionalni krem karamel s istarskim medom i lavandom", de:"Traditioneller Crème caramel mit istrischem Honig und Lavendel", en:"Traditional crème caramel with Istrian honey and lavender", it:"Crème caramel tradizionale con miele istriano e lavanda" }, price:8 },
      ]},
    ],
  },

};

// ─── TEMPLATE ZA NOVOG PARTNERA ────────────────────────────
// Kopiraj blok ispod, popuni podatke i dodaj u AFFILIATE_DATA:
//
// partner_id: {
//   name: "Ime objekta", emoji: "🏠", color: "#0ea5e9",
//   city: "Grad", region: "Regija",
//   address: { hr:"...", de:"...", en:"...", it:"..." },
//   tagline: { hr:"...", de:"...", en:"...", it:"..." },
//   desc: { hr:"...", de:"...", en:"...", it:"..." },
//   features: { hr:[...], de:[...], en:[...], it:[...] },
//   poi: [ { icon:"📍", hr:"...", de:"...", en:"...", it:"...", dist:"Xkm" } ],
//   excursions: [ { emoji:"🚢", hr:"...", de:"...", en:"...", it:"...", gyg:"URL", viator:"URL" } ],
//   booking: "https://booking.com/...",
//   heroImg: "https://images.unsplash.com/...",
//   propImg: "https://images.unsplash.com/...",
//   phone: "+385 XX XXX XXX",
//   whatsapp: "385XXXXXXXX",
//   droneVideoId: null,
//   matterportId: null,
//   hours: { hr:"...", de:"...", en:"...", it:"..." },
//   rating: 4.5,
//   reviewCount: 0,
//   gallery: [],
//   testimonials: [],
//   dailySpecials: [],
//   rooms: null,  // ili array soba ako ima smještaj
//   menu: [],
// },
