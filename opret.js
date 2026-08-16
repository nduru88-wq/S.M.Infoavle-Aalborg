const API_URL =
  "https://script.google.com/macros/s/AKfycbx71tVLXQAQDpAlfHeaIe2Y-cH3zcR5oGFqNt1ChIrP9PmkGwYyz_4FLTa060rJX-aJ/exec";

const OPRET_KODE = "1234";

let valgtGentagelse = "ingen";
const OPRET_PARAMS = new URLSearchParams(window.location.search);
let AKTIVITET_ID = OPRET_PARAMS.get("id") || "";
let REDIGER_FOREKOMST_DATO = OPRET_PARAMS.get("dato") || "";
let redigerSomEnkeltForekomst = false;

/* Kalenderens viste måned */
let kalenderAar = 0;
let kalenderMaaned = 0;

function $(id) {
  return document.getElementById(id);
}

function val(id) {
  return $(id) ? $(id).value : "";
}

function setVal(id, value) {
  if ($(id)) $(id).value = value || "";
}

function checked(id) {
  return $(id) && $(id).checked;
}

function setChecked(id, value) {
  if ($(id)) $(id).checked = !!value;
}

function setHtml(id, html) {
  if ($(id)) $(id).innerHTML = html;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function apiKald(params) {
  const url = API_URL + "?" + new URLSearchParams(params).toString();

  return fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data && data.ok === false) {
        throw new Error(data.message || "Ukendt fejl");
      }
      return data;
    });
}

window.addEventListener("load", function() {
  initKalender();
  opdaterEfterAktivitet();

  if (sessionStorage.getItem("sm_opret_login") === "ok") {
    visOpret();
  }

  if (AKTIVITET_ID) {
    visOpret();
    indlaesAktivitetTilRedigering(AKTIVITET_ID);
  }
});


window.addEventListener("resize", function() {
  opdaterEfterAktivitet();
});

/* Luk kalenderen ved klik udenfor eller Escape */
document.addEventListener("click", function(event) {
  const vaelger = document.querySelector(".dato-vaelger");

  if (vaelger && !vaelger.contains(event.target)) {
    lukKalender();
  }
});

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    lukKalender();
  }
});

function logInd() {
  if (val("adgangskode") === OPRET_KODE) {
    sessionStorage.setItem("sm_opret_login", "ok");
    visOpret();
  } else {
    setHtml("loginStatus", "Forkert kode");
  }
}

function visOpret() {
  if ($("loginBox")) $("loginBox").style.display = "none";
  if ($("opretForm")) $("opretForm").style.display = "flex";
}

/* ---------- KALENDER ---------- */

function initKalender() {
  const iDag = nulstilTid(new Date());

  setVal("dato", formatDatoInput(iDag));
  kalenderAar = iDag.getFullYear();
  kalenderMaaned = iDag.getMonth();

  opdaterDatoKnap();
  tegnKalender();
}

function toggleKalender() {
  const popup = $("kalenderPopup");
  const knap = $("datoKnap");

  if (!popup || !knap) return;

  const skalVises = !popup.classList.contains("vis");

  popup.classList.toggle("vis", skalVises);
  knap.setAttribute("aria-expanded", skalVises ? "true" : "false");

  if (skalVises) {
    const valgtDato = lavDatoFraInput(val("dato"));

    if (erGyldigDato(valgtDato)) {
      kalenderAar = valgtDato.getFullYear();
      kalenderMaaned = valgtDato.getMonth();
    }

    tegnKalender();
  }
}

function lukKalender() {
  if ($("kalenderPopup")) {
    $("kalenderPopup").classList.remove("vis");
  }

  if ($("datoKnap")) {
    $("datoKnap").setAttribute("aria-expanded", "false");
  }
}

function skiftKalenderMaaned(retning) {
  kalenderMaaned += retning;

  if (kalenderMaaned < 0) {
    kalenderMaaned = 11;
    kalenderAar--;
  }

  if (kalenderMaaned > 11) {
    kalenderMaaned = 0;
    kalenderAar++;
  }

  tegnKalender();
}

function vaelgGenvejsDato(antalDageFrem) {
  const dato = nulstilTid(new Date());
  dato.setDate(dato.getDate() + antalDageFrem);
  vaelgKalenderDato(dato);
}

function vaelgKalenderDato(dato) {
  const renDato = nulstilTid(dato);

  setVal("dato", formatDatoInput(renDato));
  kalenderAar = renDato.getFullYear();
  kalenderMaaned = renDato.getMonth();

  opdaterDatoKnap();
  tegnKalender();
  lukKalender();
}

function tegnKalender() {
  const titel = $("kalenderMaanedTitel");
  const dageBox = $("kalenderDage");

  if (!titel || !dageBox) return;

  const maanedsNavne = [
    "januar", "februar", "marts", "april", "maj", "juni",
    "juli", "august", "september", "oktober", "november", "december"
  ];

  titel.textContent = maanedsNavne[kalenderMaaned] + " " + kalenderAar;
  dageBox.innerHTML = "";

  const foersteDag = new Date(kalenderAar, kalenderMaaned, 1);
  const antalDage = new Date(kalenderAar, kalenderMaaned + 1, 0).getDate();

  /* JavaScript: søndag=0. Kalenderen skal starte mandag. */
  const tommeFelter = (foersteDag.getDay() + 6) % 7;

  for (let i = 0; i < tommeFelter; i++) {
    const tom = document.createElement("div");
    tom.className = "kalender-tom";
    dageBox.appendChild(tom);
  }

  const iDag = formatDatoInput(nulstilTid(new Date()));
  const valgt = val("dato");

  for (let dag = 1; dag <= antalDage; dag++) {
    const dato = new Date(kalenderAar, kalenderMaaned, dag);
    const datoTekst = formatDatoInput(dato);

    const knap = document.createElement("button");
    knap.type = "button";
    knap.className = "kalender-dag";
    knap.textContent = dag;
    knap.setAttribute("aria-label", formatDatoLang(dato));

    if (datoTekst === iDag) {
      knap.classList.add("i-dag");
    }

    if (datoTekst === valgt) {
      knap.classList.add("valgt");
      knap.setAttribute("aria-current", "date");
    }

    knap.addEventListener("click", function() {
      vaelgKalenderDato(dato);
    });

    dageBox.appendChild(knap);
  }
}

function opdaterDatoKnap() {
  const dato = lavDatoFraInput(val("dato"));

  if ($("datoKnap") && erGyldigDato(dato)) {
    $("datoKnap").textContent = "📅  " + formatDatoLang(dato);
  }
}

function formatDatoInput(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function formatDatoLang(d) {
  const dage = [
    "søndag", "mandag", "tirsdag", "onsdag",
    "torsdag", "fredag", "lørdag"
  ];

  const maaneder = [
    "januar", "februar", "marts", "april", "maj", "juni",
    "juli", "august", "september", "oktober", "november", "december"
  ];

  const tekst =
    dage[d.getDay()] + " " +
    d.getDate() + ". " +
    maaneder[d.getMonth()] + " " +
    d.getFullYear();

  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

function lavDatoFraInput(input) {
  const dele = String(input || "").split("-");

  if (dele.length !== 3) {
    return new Date(NaN);
  }

  return new Date(+dele[0], +dele[1] - 1, +dele[2]);
}

function nulstilTid(dato) {
  return new Date(dato.getFullYear(), dato.getMonth(), dato.getDate());
}

function erGyldigDato(dato) {
  return dato instanceof Date && !Number.isNaN(dato.getTime());
}

/* Bruges fortsat ved redigering af en aktivitet */
function sikrDatoISelect(selectId, dato) {
  if (!dato) return;

  const datoObjekt = lavDatoFraInput(dato);

  if (!erGyldigDato(datoObjekt)) return;

  setVal(selectId, dato);
  kalenderAar = datoObjekt.getFullYear();
  kalenderMaaned = datoObjekt.getMonth();

  opdaterDatoKnap();
  tegnKalender();
}

/* ---------- RESTEN AF OPRET-SIDEN ---------- */

function hentValgtAktivitet() {
  return (
    val("aktivitetInfo") ||
    val("aktivitetFravaer") ||
    val("aktivitetFast") ||
    val("aktivitet") ||
    ""
  );
}

function vaelgAktivitetFraGruppe(gruppe) {
  let valgt = "";

  if (gruppe === "info") valgt = val("aktivitetInfo");
  if (gruppe === "fravaer") valgt = val("aktivitetFravaer");
  if (gruppe === "fast") valgt = val("aktivitetFast");

  if (gruppe !== "info") setVal("aktivitetInfo", "");
  if (gruppe !== "fravaer") setVal("aktivitetFravaer", "");
  if (gruppe !== "fast") setVal("aktivitetFast", "");

  setVal("aktivitet", valgt);

  opdaterKategoriFarver();
  opdaterEfterAktivitet();
}

function opdaterKategoriFarver() {
  ["aktivitetInfo", "aktivitetFravaer", "aktivitetFast"].forEach(function(id) {
    const el = $(id);
    if (!el) return;

    el.classList.remove("valgtKategori");

    if (el.value) {
      el.classList.add("valgtKategori");
    }
  });
}

function saetAktivitetIGruppe(aktivitet) {
  setVal("aktivitetFravaer", "");
  setVal("aktivitetFast", "");
  setVal("aktivitetInfo", "");
  setVal("aktivitet", aktivitet || "");

  if (!aktivitet) return;

  const fravaer = [
    "Arbejder hjemme",
    "Ferie",
    "Fri",
    "Møder senere",
    "Syg",
    "Ude af huset"
  ];

  const fast = [
    "Aktivitets café",
    "Friday Minds",
    "Fællespause",
    "KREA",
    "Praktisk værksted",
    "Undervisning"
  ];

  if (fravaer.includes(aktivitet)) {
    setVal("aktivitetFravaer", aktivitet);
  } else if (fast.includes(aktivitet)) {
    setVal("aktivitetFast", aktivitet);
  } else {
    setVal("aktivitetInfo", aktivitet);
  }

  opdaterKategoriFarver();
}

function opdaterEfterAktivitet() {
  setVal("aktivitet", hentValgtAktivitet());

  const aktivitet = hentValgtAktivitet();
  const noteBox = $("noteBox");
  const visNote = skalViseNote(aktivitet);

  if (noteBox) {
    /*
      Note-feltet fjernes helt fra layoutet, når det ikke bruges.
      Mobilen kan nu scrolle normalt, så vi behøver ikke længere
      reservere et usynligt område til feltet.
    */
    noteBox.style.display = visNote ? "block" : "none";
    noteBox.style.visibility = "visible";
    noteBox.style.pointerEvents = "auto";
  }

  opdaterHeleDagenEfterAktivitet();
}

function skalViseNote(aktivitet) {
  return [
    "Aktivitets café",
    "Friday Minds",
    "Fællespause",
    "Info",
    "KREA",
    "Praktisk værksted",
    "Undervisning",
    "Besøg",
    "Fødselsdag",
    "Møde",
    "Møder senere",
    "Rundvisning",
    "Ude af huset",
    "Velkommen til",
    "Faglig sparring"
  ].includes(aktivitet);
}

function vaelgGentagelse(type) {
  const ugentligt = $("gentagUgentligt");
  const hver14 = $("gentag14Dage");

  valgtGentagelse = "ingen";

  if (type === "ugentligt" && ugentligt && ugentligt.checked) {
    if (hver14) hver14.checked = false;
    valgtGentagelse = "ugentligt";
  }

  if (type === "14dage" && hver14 && hver14.checked) {
    if (ugentligt) ugentligt.checked = false;
    valgtGentagelse = "14dage";
  }
}

function saetGentagelse(gentagelse) {
  valgtGentagelse = gentagelse || "ingen";
  setChecked("gentagUgentligt", valgtGentagelse === "ugentligt");
  setChecked("gentag14Dage", valgtGentagelse === "14dage");
}

function toggleHeleDagen() {
  const hele = checked("heleDagen");
  setDisabledMedOpacity("tidspunkt", hele);
  setDisabledMedOpacity("varighedTimer", hele);
  setDisabledMedOpacity("varighedMinutter", hele);
}

function setDisabledMedOpacity(id, disabled) {
  const el = $(id);
  if (!el) return;

  el.disabled = !!disabled;
  el.style.opacity = disabled ? "0.45" : "1";
}

function opdaterHeleDagenEfterAktivitet() {
  const aktivitet = hentValgtAktivitet();

  const heldagsAktiviteter = [
    "Arbejder hjemme",
    "Ferie",
    "Fri",
    "Syg",
    "Fødselsdag"
  ];

  const skalVaereHeldag = heldagsAktiviteter.includes(aktivitet);

  setChecked("heleDagen", skalVaereHeldag);

  if ($("heleDagen")) {
    $("heleDagen").disabled = skalVaereHeldag;
  }

  setDisabledMedOpacity("tidspunkt", skalVaereHeldag);
  setDisabledMedOpacity("varighedTimer", skalVaereHeldag);
  setDisabledMedOpacity("varighedMinutter", skalVaereHeldag);
}

function hentFormData() {
  const hele = checked("heleDagen");

  const timer = Number(val("varighedTimer")) || 0;
  const minutter = Number(val("varighedMinutter")) || 0;
  const samletMinutter = timer * 60 + minutter;

  return {
    dato: val("dato"),
    person: val("person"),
    aktivitet: hentValgtAktivitet(),
    tidspunkt: hele ? "08:00" : val("tidspunkt"),
    /* Entydigt format: fx "45m" eller "105m". */
    varighed: hele ? "Hele dagen" : samletMinutter + "m",
    gentagelse: valgtGentagelse,
    note: val("note")
  };
}

function saetSendKnapTilstand(tilstand, tekst) {
  const knap = $("sendBtn");
  if (!knap) return;

  knap.classList.remove("gemmer", "gemt");
  knap.disabled = false;

  if (tilstand === "gemmer") {
    knap.classList.add("gemmer");
    knap.disabled = true;
  } else if (tilstand === "gemt") {
    knap.classList.add("gemt");
    knap.disabled = true;
  }

  knap.textContent = tekst || "Send til tavle";
}

function nulstilSendKnap() {
  saetSendKnapTilstand("normal", "Send til tavle");
}

function sendTilTavle() {
  const a = hentFormData();

  if (!a.dato) {
    setHtml("status", "Vælg en dato først");
    return;
  }

  if (!a.aktivitet) {
    setHtml("status", "Vælg en aktivitet først");
    return;
  }

  /* Status under formularen bruges nu kun til fejl/validering. */
  setHtml("status", "");

  const varRedigering = !!AKTIVITET_ID && !redigerSomEnkeltForekomst;
  const varEnkeltForekomst = redigerSomEnkeltForekomst;

  saetSendKnapTilstand(
    "gemmer",
    (varRedigering || varEnkeltForekomst) ? "Opdaterer aktivitet" : "Opretter aktivitet"
  );

  const params = {
    action: redigerSomEnkeltForekomst
      ? "gemAktivitet"
      : (AKTIVITET_ID ? "opdaterAktivitet" : "gemAktivitet"),
    id: redigerSomEnkeltForekomst ? "" : AKTIVITET_ID,
    dato: a.dato,
    person: a.person,
    aktivitet: a.aktivitet,
    tidspunkt: a.tidspunkt,
    varighed: a.varighed,
    gentagelse: redigerSomEnkeltForekomst ? "ingen" : a.gentagelse,
    note: a.note,
    parentId: redigerSomEnkeltForekomst ? AKTIVITET_ID : ""
  };

  apiKald(params)
    .then(function() {
      saetSendKnapTilstand(
        "gemt",
        (varRedigering || varEnkeltForekomst)
          ? "Aktiviteten er opdateret"
          : "Aktiviteten er oprettet"
      );

      /* VIGTIGT:
         Efter en gemning skal siden igen være i OPRET-tilstand.
         Ellers kan et gammelt ?id=... få næste aktivitet til at overskrive
         den aktivitet, der lige blev redigeret. */
      nulstilRedigeringEfterGemning();

      window.setTimeout(function() {
        nulstilSendKnap();
      }, 3000);
    })
    .catch(function(err) {
      nulstilSendKnap();
      setHtml("status", "Fejl: " + err.message);
    });
}

function nulstilRedigeringEfterGemning() {
  AKTIVITET_ID = "";
  REDIGER_FOREKOMST_DATO = "";
  redigerSomEnkeltForekomst = false;

  /* Fjern id/dato fra adresselinjen uden at genindlæse siden. */
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    url.searchParams.delete("dato");
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  } catch (e) {
    /* Ældre browser: variablerne ovenfor er stadig nulstillet. */
  }

  if ($("opretTitel")) {
    $("opretTitel").textContent = "OPRET AKTIVITET";
  }
}

function indlaesAktivitetTilRedigering(id) {
  if ($("indlaeserOverlay")) {
    $("indlaeserOverlay").classList.add("vis");
  }

  apiKald({
    action: "hentAktivitet",
    id: id
  })
    .then(function(a) {
      if (!a) return;

      const originalGentagelse = String(a.gentagelse || "ingen").toLowerCase();
      const erGentaget = originalGentagelse === "ugentligt" || originalGentagelse === "14dage";

      redigerSomEnkeltForekomst =
        !!REDIGER_FOREKOMST_DATO &&
        erGentaget &&
        REDIGER_FOREKOMST_DATO !== a.dato;

      $("opretTitel").textContent = redigerSomEnkeltForekomst
        ? "REDIGER DENNE DAG"
        : "REDIGER AKTIVITET";

      sikrDatoISelect(
        "dato",
        redigerSomEnkeltForekomst ? REDIGER_FOREKOMST_DATO : a.dato
      );
      setVal("person", a.person);
      saetAktivitetIGruppe(a.aktivitet);
      setVal("tidspunkt", a.tidspunkt);
      setChecked("heleDagen", a.varighed === "Hele dagen");

      if (a.varighed !== "Hele dagen") {
        const tekst = String(a.varighed || "").trim().replace(",", ".");
        let samletMinutter;

        const minutMatch = tekst.match(/^(\d+)m$/i);

        if (minutMatch) {
          samletMinutter = Number(minutMatch[1]);
        } else {
          const decimalTimer = Number(tekst);
          samletMinutter = Number.isFinite(decimalTimer)
            ? Math.round(decimalTimer * 60)
            : 60;
        }

        const timer = Math.floor(samletMinutter / 60);
        const minutter = samletMinutter % 60;

        setVal("varighedTimer", timer);
        setVal("varighedMinutter", minutter);
      }

      setVal("note", redigerSomEnkeltForekomst ? "" : (a.note || ""));
      saetGentagelse(
        redigerSomEnkeltForekomst ? "ingen" : (a.gentagelse || "ingen")
      );

      toggleHeleDagen();
      opdaterEfterAktivitet();
      opdaterKategoriFarver();
    })
    .catch(function(err) {
      setHtml("status", "Fejl: " + err.message);
    })
    .finally(function() {
      if ($("indlaeserOverlay")) {
        $("indlaeserOverlay").classList.remove("vis");
      }
    });
}

function gaaDirekteTilTavle() {
  const erMobil = window.matchMedia("(max-width: 768px)").matches;

  if (erMobil) {
    window.open("index.html?mobil=1", "_blank");
  } else {
    window.open("index.html", "_blank");
  }
}
