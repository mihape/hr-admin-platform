# HR Admin Platform - CRM atadasi jegyzet

## Cel

Ez az onallo HR Admin Platform egy kozos feluletet ad a HR kolleganak a Rezsi / Alberletek, Flotta, Jelenleti iv es Szamlak modulok hasznalatahoz. A jelenlegi verzio web-only MVP: bongeszos helyi tarolast hasznal, de mar tartalmazza azokat az adapterhatarokat, amelyekre kesobb a Projekto / lite-shift CRM integracio epulhet.

A handoff a kovetkezo CRM dokumentumokhoz igazodik:

- `PROJEKTO_MASTER_DOKUMENTACIO.md`: Projekto mint modularisan bovitheto, tobborganizacios es tobbirodas uzleti platform.
- `README_CRM.md`: modularis SaaS architektura, modul registry, organizacio-modul konfiguracio, fuggosegek es frontend modul vedelem.
- `KNOWLEDGE_Crm.md`: kotelezo fejlesztoi formai, kodolasi, architekturalis es PR kovetelmenyek.

## CRM oldali alapelvek

- A CRM legfelso szervezeti szintje az organizacio, alatta irodakkal.
- Minden uj modulnak `org_uid` szerint tenant-aware modon kell mukodnie.
- Ahol relevans, az adatmodell kesobb `office_uid`-hoz is kotheto.
- A modulok nem iframe-kent kerulnek be, hanem nativ CRM modulkent.
- A CRM modularis SaaS terve szerint a modulok engedelyezese szervezetenkent tortenik.
- A HR Admin modulok ne keruljek meg a CRM meglevo Munkatarsak, Munkaido, Szabadsagok es Projektek logikajat.

## Kotelezo fejlesztoi kovetelmenyek CRM integraciohoz

A CRM-be emeleskor a `KNOWLEDGE_Crm.md` szabalyai kotelezoek. Ezek a standalone MVP-re meg nem teljesen ervenyesek, de minden CRM PR-nal ervenyesiteni kell oket.

Kodminoseg es formatum:

- TypeScript only: CRM oldalon csak `.ts` es `.tsx`; `.js` / `.jsx` nem kerulhet be.
- `any` hasznalata tilos; minden interface/type explicit legyen, `T` prefixszel, peldaul `TAttendanceEntry`.
- `function` kulcsszo helyett arrow function hasznalando.
- Minden `if` blokk kapcsos zarojeles, one-liner nelkul.
- 2 space indentacio, LF sorvegek, trailing newline minden fajl vegen.
- Import csoportok: eloszor 3rd-party, utana belso importok, ures sorral elvalasztva.
- Konstansok, regexek es default ertekek `src/consts/*.const.ts` fajlokba keruljenek.
- Magyar komment tilos; komment csak angolul, es csak akkor, ha tenyleg szukseges.
- Kikommentezett regi kod es production `console.log` nem maradhat PR-ban.
- 300 sor koruli fajloknal szetbontas szukseges komponensekre, utilokra vagy service-ekre.

Frontend szabalyok:

- React server state-hez TanStack Query kotelezo; API adatlekereshez ne keszuljon sajat `useEffect` + `fetch` logika.
- Zustand vagy Context csak kliens oldali UI allapothoz hasznalhato.
- Inline `style={{}}` tilos.
- Elso valasztas PrimeFlex utility osztaly; ha nem eleg, kulon `.scss` fajl ugyanabban a feature/component mappaban.
- PrimeReact komponensek magyar lokalizacioval mukodjenek; Calendar eseteben `locale="hu"` es `dateFormat="yy.mm.dd"`.
- Ikonokhoz FontAwesome 6 (`fa-solid fa-*`) hasznalando, PrimeIcons (`pi pi-*`) nem.
- Mobil nezet kotelezo, panelekben container-szelesseghez igazodo layouttal, nem csak viewport breakpointokkal.

Backend es architektura:

- NestJS/React retegek tisztan valjanak szet: controller, service, repo.
- API adatok tenant-aware modon szurodjenek `org_uid` szerint, ahol kell `office_uid` szerint is.
- Environment boolean ertekeket soha nem truthiness alapon kell vizsgalni; explicit string osszehasonlitas kell, peldaul `=== 'true'`.
- Permission modell: nincs elore definialt role DB-ben; role csak UI preset, a valos jogosultsag `tbl_user_permissions`.
- `::create` es `::edit` jogosultsaghoz automatikus `::read` fuggoseg tartozik.
- Modul route guardok elott a Settings UI MVP es permission kezeles allapota ellenorizendo.

Repo es PR higienia:

- Tiltott commit fajlok: binaris feltoltesek (`*.pdf`, `*.jpeg`, `*.png`), debug/log fajlok (`*.txt`, `git_log.txt`, `status.txt`), seed/helper scriptek, lokalis dump/temp fajlok.
- Local S3 emulator feltoltesei (`local_s3_uploads/`) nem kerulhetnek repo-ba.
- PR elott kotelezo ellenorzes: indentacio, newline, console log, TanStack Query, TypeScript, tiszta diff, tiltott fajlok hianya.

## Jelenlegi modulhatarok

- `utilities`: Rezsi / Alberletek modul az eredeti Rezsi app adatmodellje alapjan: ingatlanok, berlok, havi meroallasok, ismetlodo tetelek, egyszeri plusz tetelek, fizetett osszeg, hatarido es egyenleg.
- `fleet`: Flotta modul az eredeti Auto_Flotta localStorage modellje alapjan: jarmuvek, tankolasok, szervizek, kilometerora-szinkron, koltsegek es lejarati figyelmeztetesek.
- `attendance`: Jelenleti iv modul az eredeti heti jelenleti iv folyamat alapjan: helyi munkatarslista, ISO het valasztas, unnepnap jeloles, A4 elonezet es tomeges nyomtatas.
- `invoices`: Szamla modul az Excelben vezetett alap nyilvantartas kivaltasara: datum, partner, szamlaszam, netto, AFA, brutto, fizetesi mod, statusz, hatarido, kategoria es CSV/paste import.

## Javasolt CRM modul kulcsok

A `README_CRM.md` modul tablaja es registry terve alapjan ezek legyenek az elso javasolt `module_key` ertekek:

- `utilities`: Rezsi / Alberletek. Onallo opcionalis modul, kesobb projekthez vagy ugyfelhez kapcsolhato.
- `fleet`: Ceges autok es flotta koltsegek. Onallo opcionalis modul.
- `attendance`: Jelenleti iv export es heti jelenleti workflow. Ne duplikalja a CRM `time_entries` modult, hanem arra epuljon vagy azzal legyen osszekotve.
- `invoices`: Egyszeru szamla nyilvantartas. Onallo opcionalis modul, kesobb `projects`, `clients`, `materials` vagy penzugyi modul fele kapcsolhato.

Javasolt fuggosegek:

- `attendance` -> `employees` / Munkatarsak, opcionalisan `projects` es `time_entries`.
- `utilities` -> opcionalisan `clients` vagy `projects`, ha az ingatlan/alberlet projekt- vagy ugyfelkapcsolatot kap.
- `fleet` -> opcionalisan `employees` vagy `projects`, ha auto-hozzarendeles, menetlevel vagy projektkoltseg lesz.
- `invoices` -> opcionalisan `clients`, `projects`, `materials` vagy kesobbi finance/billing modul, ha szamlak projekt- vagy ugyfelkapcsolatot kapnak.

## CRM-ben cserelendo adapterek

- `authTenantAdapter`: a helyi demo tenant es user helyett CRM session adat, `org_uid`, `office_uid`, szerepkor es jogosultsag-ellenorzes.
- `employeeAdapter`: a helyi munkatarslista helyett a CRM Munkatarsak modul API-ja.
- `module-registry`: a standalone modul manifest lekepezese a CRM `ModuleRegistry` es frontend `MODULE_CONFIGS` strukturaiba.
- `exportPrintAdapter`: a helyi CSV/JSON/window.print mukodes cserelese CRM export service-re, audit trailre es jogosultsagkezelt dokumentumgeneralasra.

## Illeszkedes a README_CRM modularis SaaS tervhez

Backend oldalon a HR Admin modulok a CRM modul infrastrukturan keresztul keruljenek be:

- `bc.tbl_modules`: `utilities`, `fleet`, `attendance`, `invoices` modulok regisztralasa.
- `bc.tbl_organization_modules`: szervezetenkenti enable/disable allapot.
- `bc.tbl_module_dependencies`: fuggosegek rogzitese, peldaul `attendance` -> `employees`.
- `src/modules/module.registry.ts`: modul definiciok regisztralasa.
- `moduleAccessMiddleware(moduleKey)`: minden uj API route modul-hozzaferes ellenorzessel fusson.
- Dinamikus route regisztracio: az uj modul route-ok csak engedelyezett modul eseten legyenek elerhetok.

Frontend oldalon a modulok a CRM modul konfiguraciohoz igazodjanak:

- `src/modules/module.config.ts`: `utilities`, `fleet`, `attendance`, `invoices` konfiguracio.
- `ModuleContext`: engedelyezett modulok lekerdezese szervezet szerint.
- `ModuleRoute`: route vedelem modul alapjan.
- Dinamikus navigacio: csak az engedelyezett HR Admin modulok jelenjenek meg.

## Fontos HR atfedesek

A master dokumentacio szerint a CRM mar kezel munkatarsi adatokat, szabadsagokat, betegszabadsagokat, munkaidot es jelenleti adatokat. Ezert:

- A Jelenleti iv modul ne hozzon letre masodik munkatars-torzset a CRM-ben.
- A standalone `employeeAdapter` helyere CRM-ben a Munkatarsak modul keruljon.
- A jelenleti export a CRM munkaido/jelenleti adataibol dolgozzon, vagy a rogzitett jelenleti adatokat oda irja vissza.
- A szabadsag es betegszabadsag adatok ne duplikalodjanak, hanem a mar letezo CRM szabadsag modul legyen a forras.
- Projektelszamolasnal a jelenleti rekordok kapcsolodjanak projekthez, datumhoz, munkatarshoz es ido intervallumhoz.

## Javasolt epic

Cim: HR Admin Platform modulok integralasa a Projekto / lite-shift CRM-be

Cel: Az onallo HR Admin modulok atemelese a CRM kodbazisba nativ, tenant-aware modulkent, iframe integracio nelkul, a CRM modularis SaaS architekturajahoz es a `KNOWLEDGE_Crm.md` fejlesztoi szabalyaihoz igazodva.

Elfogadasi feltetelek:

- A CRM felhasznalok a CRM navigaciobol meg tudjak nyitni a Rezsi / Alberletek, Flotta, Jelenleti iv es Szamlak modulokat.
- Minden modul adat `org_uid` szerint szurt, es ahol kell, `office_uid`-hoz is kapcsolhato.
- A modulok szerepelnek a CRM modul registryben es az organizacio-modul konfiguracioban.
- A Jelenleti iv a CRM Munkatarsak modulbol olvassa a munkatarsakat.
- A jelenleti workflow kapcsolodhasson projekthez es a CRM munkaido/jelenleti folyamataihoz.
- Az export es nyomtatasi muveletek jogosultsaghoz kotottek es visszakovethetok.
- A CRM PR-ok megfelelnek a `KNOWLEDGE_Crm.md` TypeScript, styling, state management, permission es PR hygiene elvarasainak.
- Az onallo MVP a CRM migracio befejezeseig tovabbra is hasznalhato marad.

## Javasolt sub-issue bontas

1. CRM modul kulcsok, fuggosegek es manifest definiciok veglegesitese.
2. `tbl_modules`, `tbl_organization_modules`, `tbl_module_dependencies` seed/migracio bovites a negy uj modulhoz.
3. Backend `ModuleRegistry` definiciok letrehozasa: `utilities`, `fleet`, `attendance`, `invoices`.
4. Frontend `MODULE_CONFIGS`, `ModuleRoute` es navigacios bekotes a negy modulhoz.
5. `attendance` modul osszekotese a CRM Munkatarsak modul API-javal.
6. `attendance` es CRM `time_entries` / munkaido folyamat kapcsolatanak megtervezese.
7. Tenant-aware API-k keszitese a rezsi elszamolasokhoz es ingatlanokhoz.
8. Tenant-aware API-k keszitese a flotta jarmuvekhez, tankolasokhoz es szervizekhez.
9. Tenant-aware API-k es import endpoint keszitese a szamla nyilvantartashoz, CSV/Excel migracios tervvel.
10. A standalone UI modulok portolasa CRM feature mappakba, TypeScript/React komponensekre bontva.
11. TanStack Query hookok es API reteg kialakitasa minden szerveroldali adatlekereshez.
12. PrimeFlex / SCSS alapu CRM design system illesztes, inline style nelkul, FontAwesome ikonokkal.
13. A helyi export/print adapter cserelese CRM export service-re.
14. Permission es module access tesztek hozzaadasa.
15. Smoke tesztek hozzaadasa navigaciora, tenant izolaciora, modul jogosultsagra es modul workflow-kra.
16. PR hygiene ellenorzes a `KNOWLEDGE_Crm.md` checklist alapjan.
17. Epic zaro dokumentacio: mi maradt standalone, mi kerult CRM-be, es mely modulok kapcsolhatok be szervezetenkent.
