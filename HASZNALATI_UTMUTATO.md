# HR Admin Platform - Használati útmutató

## 1. Indítás és telepített használat

Telepített verzióban az alkalmazás a Start menüből vagy az asztali parancsikonról indítható.

Fejlesztői vagy kicsomagolt build esetén a futtatható app innen indítható:

`dist/win-unpacked/HR Admin Platform.exe`

Az app alapból helyi Windows adatfájlba ment, ha a telepített Electron környezetben fut. A Beállításokban választható közös NAS/hálózati adatfájl is. Böngészős tesztelésnél localStorage fallbacket használ, ezért az éles napi használathoz a Windows appot érdemes indítani.

## 2. Első beállítás

Nyisd meg a **Beállítások** modult.

Itt add meg:

- cég neve
- működési mód vagy megjegyzés
- felhasználó neve
- számla alap fizetési módja
- számla alap fizetési határideje
- alap kategória
- kiegyenlítéskor automatikusan kerüljön-e be a mai dátum

Mentés után az oldalsáv, az áttekintő és a számlamodul is az új alapadatokat használja.

A **Beállítások** oldalon látható még:

- az app verziója
- az aktív adatmentési mód
- az aktuális adatfájl útvonala, ha elérhető
- a mentett partnerlista
- az adatkezelési műveletek: közös adatfájl, helyi adatfájl, biztonsági mentés, visszatöltés és átadási export

## 3. Áttekintés

Az **Áttekintés** oldalon látszanak a fő modulok és a napi fókusz.

A napi fókusz automatikusan jelzi például:

- lejárt vagy fizetésre váró számlákat
- 7 napon belül esedékes, nyitott számlákat
- flotta határidőket
- rezsi vagy albérlet nyitott egyenlegeket
- jelenléti ív előkészítési teendőket

A modul kártyákra kattintva az adott modul nyílik meg. A felső globális kereső a modulok között és az aktív modul tartalmában is segít keresni.

Az adatkezelési műveletek nem az áttekintésen vannak, hanem a **Beállítások / Adatok és átadás** panelen.

## 4. Számlák

Nyisd meg a **Számlák** modult.

Új számla rögzítéséhez töltsd ki az űrlapot. A Beállításokban megadott alap fizetési mód, határidő és kategória automatikusan előtöltődik.

Ha a fizetési mód **Készpénz**, a fizetési határidő automatikusan aznapi, a számla pedig **Kiegyenlítve** állapotot kap. Így nem jelenik meg tévesen **Utalva** státusszal.

A partner mező tanul:

- ha egyszer felvittél egy partnert, később felajánlja
- a táblában a partner neve kattintható
- kattintásra partner szerinti szűrés indul

### Szűrés és fókusz nézet

A számlák felett külön **Számla keresés** mező van. Ez csak a számlákon belül keres, így nem kell felgörgetni a globális keresőhöz.

Használható még:

- státusz szűrő
- fizetési mód szűrő
- oszloponkénti szűrés
- projekt chip
- partner chip
- hónapválasztó

A **Fókusz nézet** elrejti a statisztikai boxokat és az űrlapot. Ilyenkor csak a hónapválasztó, a kereső/szűrő sáv és a számlalista marad elöl.

### Tömeges kiegyenlítés

A számlalistában a nyitott számlák mellett checkbox jelenik meg.

Lépések:

1. Szűrj partnerre, hónapra vagy státuszra.
2. Jelöld ki a kiegyenlítendő számlákat.
3. Kattints a **Kiegyenlítés** gombra.

Ha a Beállításokban aktív a mai dátum automatikus kitöltése, az utalás dátuma is bekerül. A tömeges kiegyenlítés továbbra is **Utalva** állapotot állít be, mert ez jellemzően utalásos csomagokra való.

### Mentett partnerek

A **Beállítások / Mentett partnerek** részen kezelhető a partnerlista.

Itt lehet:

- új partnert hozzáadni
- partnerlistát frissíteni a számlákból
- partnert átnevezni
- mentett partnert törölni

Átnevezéskor a meglévő számlák partnerneve is frissül.

### Import és export

A számla modulban használható:

- Excel/CSV import
- látható lista CSV export
- kimutatás a szűrt lista alapján

Importnál támogatott mezők például: dátum, partner vagy kiállító, számlaszám, nettó, ÁFA, bruttó, fizetési mód, fizetési határidő, kiegyenlítés, projekt, megjegyzés.

A **Kimutatás** panel a jelenleg látható vagy szűrt számlalistát összesíti:

- bruttó összesen
- fizetésre váró összeg
- kiegyenlített összeg
- ÁFA tartalom
- lejárt számlák összege
- kategória és fizetési mód szerinti bontás

A **Látható CSV export** csak azt a listát exportálja, amit éppen a hónapválasztó, kereső, státusz, partner, projekt vagy oszlopszűrő után látsz. Az exportban szerepel a szűrési kör, a státuszcsoport, a lejárt jelzés és a határidőig hátralévő napok száma is.

## 5. Flotta

Nyisd meg a **Flotta** modult.

Ez a céges autók, tankolások, szervizek és lejáratok gyors nyilvántartására szolgál.

### Áttekintés

Az áttekintésben látszik:

- aktív járművek száma
- havi üzemanyagköltség
- havi szervizköltség
- figyelendő határidők
- legutóbbi tankolások
- lejárt vagy 30 napon belüli műszaki és KGFB lejáratok

Ha nincs lejárt vagy közeli határidő, a határidő panel ezt külön jelzi. Így nem keverednek a rendben lévő autók a ténylegesen figyelendő feladatokkal.

### Autók kezelése

Az **Autók** fülön választható ki egy jármű. A részleteknél látszik az óraállás, a műszaki lejárat, a KGFB lejárat, az összesített tankolás és szerviz.

Autó rögzítéséhez vagy módosításához használd a **Rögzítés** fület.

Megadható:

- rendszám
- típus vagy modell
- kilométeróra állás
- műszaki lejárat
- KGFB lejárat

### Tankolás rögzítése

A **Rögzítés** fülön a tankoláshoz add meg:

- autó
- dátum
- kilométeróra állás
- liter
- költség

Mentés után az adott autó kilométeróra állása frissül, ha az új érték magasabb a korábbinál. A fogyasztás az előző tankolás alapján számolódik.

### Szerviz és munkalap

Szerviz rögzítéséhez add meg:

- autó
- dátum
- típus
- költség
- leírás

A **Naplók** fülön külön látszanak a tankolások és a munkalapok. A modul exportálható CSV-be.

## 6. Rezsi és Albérlet

Nyisd meg a **Rezsi** modult.

Ez az ingatlanok, bérlők, mérőállások, bérleti díjak és havi elszámolások kezelésére szolgál.

### Hónap és ingatlan kiválasztása

A modul tetején választható:

- aktív ingatlan
- elszámolási hónap
- bérlő
- fizetési határidő

Az ingatlan vagy hónap váltása után a havi elszámolás automatikusan frissül.

### Havi elszámolás

Az **Elszámolás** fülön rögzíthető:

- víz előző és aktuális állás
- villany előző és aktuális állás
- gáz előző és aktuális állás
- egységárak
- bérleti díj
- fizetett összeg
- egyszeri plusz tétel

A modul kiszámolja a közműveket, a bérleti díjat, az ismétlődő tételeket, az egyszeri plusz tételeket, a fizetendő összeget és az egyenleget.

Az **Áttekintés** fülön látszik:

- aktív ingatlanok száma
- kiválasztott ingatlan havi fizetendője
- kiválasztott ingatlan aktuális egyenlege
- gyors összesítő közmű, bérleti díj, plusz tételek és egyenleg bontással
- nyitott egyenlegek ingatlanonként és hónaponként

A nyitott egyenlegek panel a határidőt is jelzi, így gyorsan látszik, mi lejárt vagy mi esedékes hamarosan.

### Ingatlanok

Az **Ingatlanok** fülön új ingatlan vagy albérlet vehető fel.

Megadható:

- ingatlan neve
- bérlő
- cím vagy azonosító
- bérleti díj
- kaució
- telefon

A táblában egy ingatlan sorára kattintva az adott ingatlan havi elszámolása nyílik meg. A modulból nyomtatás és CSV export is indítható.

## 7. Jelenlét

Nyisd meg a **Jelenlét** modult.

Itt munkatársakat lehet kezelni, és heti jelenléti íveket lehet előkészíteni.

Használható funkciók:

- új munkatárs felvétele
- meglévő munkatárs szerkesztése
- aktív/inaktív állapot kezelése
- heti ív előnézet
- jelenlegi ív nyomtatása
- összes aktív munkatárs ívének nyomtatása
- CSV export

A nyomtatás A4-es lapra optimalizált. A hétválasztóval megadható, melyik hét jelenléti íve készüljön.

## 8. Biztonsági mentés

A **Beállítások / Adatok és átadás** részen elérhető:

- közös adatfájl kiválasztása
- helyi adatfájlra visszaváltás, ha éppen közös adatfájl aktív
- Biztonsági mentés
- Mentés visszatöltése
- Átadási fájl export

Érdemes rendszeresen biztonsági mentést készíteni, főleg nagyobb import, adattisztítás vagy végleges átadás előtt.

### Közös NAS adatfájl

A **Beállítások / Adatok és átadás** részen a **Közös adatfájl kiválasztása** gombbal megadható egy NAS vagy Windows hálózati megosztáson lévő JSON fájl.

Példa:

`\\nas-neve\megosztas\hr-admin-data.json`

Ha a kiválasztott fájl még nem létezik, az app létrehozza a jelenlegi adatokkal. Ha már létezik, akkor ellenőrzi, hogy HR Admin adatfájl-e, majd újratöltés után azt használja.

Javaslat:

- a NAS mappához csak az kapjon írási jogot, aki tényleg szerkesztheti az adatokat
- egyszerre lehetőleg egy ember szerkessze ugyanazokat a rekordokat
- a NAS fájlról készüljön rendszeres külön mentés
- ha a NAS nem elérhető, előbb a hálózati kapcsolatot kell helyreállítani vagy vissza kell váltani helyi adatfájlra

## 9. Ismert korlátok

- A közös NAS adatfájl nem teljes többfelhasználós szerveres rendszer, hanem közös JSON fájl rövid írási zárral.
- Több gépes használatnál továbbra is fontos a Windows/NAS jogosultság és a rendszeres mentés.
- Böngészőből tesztelve az adatmentés localStorage fallbacket használ.
- A végleges installer buildhez natív Windows buildkörnyezet vagy megfelelő Wine környezet kell.

## 10. Gyors ellenőrzés átadás előtt

Átadás előtt érdemes végigmenni ezen:

- cég- és felhasználónév beállítva
- új számla rögzítése működik
- partner autocomplete működik
- fókusz nézet jól jelenik meg
- tömeges kiegyenlítés működik
- flotta autónál tankolás és szerviz menthető
- rezsi/albérlet havi elszámolás számol
- jelenléti ív nyomtatható
- biztonsági mentés készül
- telepített verziónál az app a Start menüből vagy parancsikonról indul
- fejlesztői/kicsomagolt buildnél az app a `dist/win-unpacked/HR Admin Platform.exe` fájlból indul
