# P18 – Konvejerinis failų apdorojimas.

Tai lygiagretaus programavimo projektas, kuriame apdorojami Shopify tipo produktų duomenys.

Projekto tikslas yra sukurti nuoseklų ir lygiagretų failų apdorojimą bei palyginti jų veikimo greitį.

## Naudojamos technologijos

- **TypeScript** – pagrindinė programavimo kalba.
- **Node.js** – programos paleidimui.
- **Worker Threads** – lygiagrečiam produktų apdorojimui.
- **stream-json** – didelių JSON failų skaitymui dalimis.
- **Node.js Streams** – rezultatų įrašymui į failą.
- **Promises / Async / Await** – asinchroniniam programos veikimui.
- **CSV** – testavimo rezultatams išsaugoti.

## Kaip veikia projektas?

Programa paima JSON failą su produktais ir atlieka kelis pakeitimus:

1. Padidina produkto kainą 10 %.
2. Sugeneruoja SEO pavadinimą.
3. Patikrina, ar produktas yra sandėlyje.
4. Išsaugo apdorotus produktus naujame JSON faile.

Yra dvi programos versijos.

### Nuosekli versija

Nuosekli versija (`sequential.ts`) pirmiausia perskaito visą failą, tada apdoroja produktus po vieną ir galiausiai išsaugo rezultatus.

### Lygiagreti versija

Lygiagreti versija (`parallel.ts`) naudoja trijų etapų konvejerį:

1. **Nuskaitymas** – produktai skaitomi iš JSON failo partijomis po 250.
2. **Transformavimas** – produktų partijos apdorojamos naudojant kelis Worker Threads.
3. **Įrašymas** – apdoroti produktai išsaugomi naujame JSON faile.

Tarp etapų naudojamos ribotos eilės (`BoundedQueue`), kurių talpa yra 5 partijos. Jos padeda kontroliuoti duomenų srautą.

## Greičio testavimas

Projekte yra `benchmark.ts` failas, kuris automatiškai paleidžia nuoseklią ir lygiagrečią versijas.

Testuojami skirtingi produktų kiekiai:

- 1 000
- 10 000
- 100 000

Lygiagreti versija testuojama su 1, 2, 4 ir 8 worker'iais.

Kiekvienas testas kartojamas 5 kartus.

Testavimą galima paleisti:

```bash
npx tsx src/benchmark.ts
```

Rezultatai išsaugomi faile:

```text
results/benchmark.csv
```

Programa matuoja bendrą vykdymo laiką ir pralaidumą (kiek produktų apdorojama per sekundę).

Pagal šiuos duomenis galima palyginti, ar lygiagreti versija yra greitesnė už nuoseklią.

## Ką pastebėjau?

Lygiagretus apdorojimas ne visada yra greitesnis.

Kai produktų kiekis mažas, papildomo laiko reikia worker'ių paleidimui ir duomenų perdavimui tarp gijų.

Didesniems duomenų kiekiams lygiagretus apdorojimas gali būti naudingesnis, tačiau tai priklauso nuo kompiuterio ir atliekamų operacijų.

Taip pat svarbu pasirinkti tinkamą worker'ių skaičių, nes didesnis jų kiekis nebūtinai reiškia geresnį rezultatą.

## Pastabos

- Projektas naudoja sugeneruotus Shopify tipo produktų duomenis.
- Programa nėra tiesiogiai prijungta prie Shopify API.
- Produktai apdorojami lokaliai, naudojant JSON failus.
- Lygiagrečioje versijoje išlaikoma pradinė produktų tvarka.
