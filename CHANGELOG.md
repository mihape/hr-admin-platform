# Changelog

## 0.3.3 - 2026-06-26

- CI: az installer build parancsok explicit `--publish never` kapcsolót kaptak, így az `electron-builder` nem próbál közvetlenül GitHubra publikálni.
- CI: a GitHub Release asset feltöltés továbbra is a dedikált workflow release lépésben történik.
- Dokumentáció: portfolio/workflow, PR template, issue template és CI troubleshooting kiegészítések.
- Dokumentáció: DPAPI/Electron safeStorage helyi adattitkosítási kutatás és NAS/shared data mode biztonsági megfontolások.

## 0.3.2 - 2026-06-26

- Számla modul: a dedikált számlakereső gépeléskor már nem rajzolja újra a teljes modult, csak a számlatáblát és a számlálókat frissíti.
- QA: Chrome/CDP ellenőrzés szerint gépelés előtt és után azonos maradt a scrollpozíció.

## 0.3.1 - 2026-06-26

- Számla modul: a dedikált számlakereső gépelés közben nem ugrik vissza az oldal tetejére.
- Számla modul: készpénzes fizetésnél a fizetési határidő automatikusan aznapi.
- Számla modul: készpénzes fizetésnél az új számla automatikusan `Kiegyenlítve` állapotot kap `Utalva` helyett.
- Számla modul: a fizetett/nyitott összesítések már az `Utalva` és `Kiegyenlítve` státuszt is fizetettként kezelik.

## 0.3.0 - 2026-06-26

- Beállítások modul: választható közös NAS/hálózati JSON adatfájl.
- Tárolás: külön `hr-admin-storage-config.json` konfiguráció az aktív adatfájl útvonalához.
- Tárolás: rövid `.lock` fájl írás közben, hogy kisebb legyen az egyszerre írás kockázata.
- Beállítások modul: aktív adatfájl útvonal és közös adatfájl állapot megjelenítése.
- Beállítások modul: visszaváltás helyi adatfájlra.
- Dokumentáció: NAS/shared data file deployment, security és architecture kiegészítés.
- Új 0.3.0 release és demo installer build.

## 0.2.0 - 2026-06-25

- Public portfolio pack with English-first README and Hungarian summary.
- SysAdmin-focused deployment, security, and architecture documentation.
- GitHub Actions workflow for Windows installer builds and tag-based releases.
- GitHub issue templates and starter issue backlog.
- Public sample invoice CSV now uses fictional demo data only.
- Klasszikus Windows telepítővarázsló NSIS-szel, célmappa-választással.
- Külön release és demo build mód.
- Release build friss gépen üres adatbázissal indul.
- Demo build minta számlákkal, autókkal, ingatlanokkal és munkatársakkal indul.
- Számla modul: mentett partnerlista, partner autocomplete, partner szerinti kattintható szűrés.
- Számla modul: tömeges kiegyenlítés checkboxokkal és egy gombos kiegyenlítéssel.
- Számla modul: utalás dátuma megjelenik és menthető.
- Számla modul: dedikált számlakereső és fókusz nézet.
- Beállítások modul: cégadatok, felhasználónév, számla alapértékek és mentés.
- Áttekintő: személyesebb üdvözlés és aktuális napi fókusz.
- App ikon bekötése Windows ablakikonként, build ikonként és faviconként.
- Használati útmutató kibővítése számla, flotta, rezsi/albérlet és jelenlét fejezetekkel.
- Modul szövegek és ékezetek javítása.

## 0.1.0 - Korai MVP

- Alap Electron app.
- Moduláris HR admin felület.
- Számla, flotta, jelenlét és rezsi/albérlet alapmodulok.
- Helyi adatmentés.
