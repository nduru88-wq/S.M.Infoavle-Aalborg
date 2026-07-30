const API_URL =
  "https://script.google.com/macros/s/AKfycbxCbzb_VfTlnmdCwIZYdfw140IvNZuPNeNNTXIGV9DLyPoSWp6tNtg3mqqEfVKLfptk/exec";

const OPRET_KODE = "12345678";

let valgtGentagelse = "ingen";
let AKTIVITET_ID = new URLSearchParams(window.location.search).get("id") || "";

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
  fyldDatoer("dato");
  opdaterEfterAktivitet();

  if (sessionStorage.getItem("sm_opret_login") === "ok") {
    visOpret();
  }

  if (AKTIVITET_ID) {
    visOpret();
    indlaesAktivitetTilRedigering(AKTIVITET_ID);
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

function fyldDatoer(selectId) {
  const select = $(selectId);
  if (!select) return;

  select.innerHTML = "";

  const iDag = new Date();

  for (let i = 0; i < 120; i++) {
    const d = new Date(iDag);
    d.setDate(iDag.getDate() + i);

    const opt = document.createElement("option");
    opt.value = formatDatoInput(d);
    opt.textContent = formatDatoVisning(d);
    select.appendChild(opt);
  }
}

function formatDatoInput(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function formatDatoVisning(d) {
  const dage = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  return dage[d.getDay()] + " " + pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
}

function lavDatoFraInput(input) {
  const dele = String(input || "").split("-");
  return new Date(+dele[0], +dele[1] - 1, +dele[2]);
}

function sikrDatoISelect(selectId, dato) {
  const select = $(selectId);
  if (!select || !dato) return;

  let findes = false;

  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value === dato) {
      findes = true;
      break;
    }
  }

  if (!findes) {
    const d = lavDatoFraInput(dato);
    const opt = document.createElement("option");
    opt.value = dato;
    opt.textContent = formatDatoVisning(d);
    select.insertBefore(opt, select.firstChild);
  }

  select.value = dato;
}

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

  const fravaer = ["Arbejder hjemme", "Ferie", "Fri", "Syg"];

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

  if (noteBox) {
    noteBox.style.display = skalViseNote(aktivitet) ? "block" : "none";
  }

  opdaterHeleDagenEfterAktivitet();
}

function skalViseNote(aktivitet) {
  return [
    "Aktivitets café",
    "Friday Minds",
    "Fællespause",
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
  const dagligt = $("gentagDagligt");
  const ugentligt = $("gentagUgentligt");

  valgtGentagelse = "ingen";

  if (type === "dagligt" && dagligt.checked) {
    ugentligt.checked = false;
    valgtGentagelse = "dagligt";
  }

  if (type === "ugentligt" && ugentligt.checked) {
    dagligt.checked = false;
    valgtGentagelse = "ugentligt";
  }
}

function saetGentagelse(gentagelse) {
  valgtGentagelse = gentagelse || "ingen";
  setChecked("gentagDagligt", valgtGentagelse === "dagligt");
  setChecked("gentagUgentligt", valgtGentagelse === "ugentligt");
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

  const skalVaereHeldag =
    val("aktivitetFravaer") !== "" ||
    aktivitet === "Fødselsdag";

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

  return {
    dato: val("dato"),
    person: val("person"),
    aktivitet: hentValgtAktivitet(),
    tidspunkt: hele ? "08:00" : val("tidspunkt"),
    varighed: hele ? "Hele dagen" : (
  Number(val("varighedTimer")) + Number(val("varighedMinutter")) / 60
),
    gentagelse: valgtGentagelse,
    note: val("note")
  };
}

function sendTilTavle() {
  const a = hentFormData();

  if (!a.aktivitet) {
    setHtml("status", "Vælg en aktivitet først");
    return;
  }

  setHtml("status", "Gemmer...");

  const params = {
    action: AKTIVITET_ID ? "opdaterAktivitet" : "gemAktivitet",
    id: AKTIVITET_ID,
    dato: a.dato,
    person: a.person,
    aktivitet: a.aktivitet,
    tidspunkt: a.tidspunkt,
    varighed: a.varighed,
    gentagelse: a.gentagelse,
    note: a.note
  };

  apiKald(params)
    .then(function() {
      setHtml("status", AKTIVITET_ID ? "Aktiviteten er opdateret" : "Aktiviteten er gemt");
    })
    .catch(function(err) {
      setHtml("status", "Fejl: " + err.message);
    });
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

      $("opretTitel").textContent = "REDIGER AKTIVITET";

      sikrDatoISelect("dato", a.dato);
      setVal("person", a.person);
      saetAktivitetIGruppe(a.aktivitet);
      setVal("tidspunkt", a.tidspunkt);
      setChecked("heleDagen", a.varighed === "Hele dagen");

      if (a.varighed !== "Hele dagen") {
  const samletVarighed = Number(a.varighed || 1);
  const timer = Math.floor(samletVarighed);
  const minutter = Math.round((samletVarighed - timer) * 60);

  setVal("varighedTimer", timer);
  setVal("varighedMinutter", minutter);
}

      setVal("note", a.note || "");
      saetGentagelse(a.gentagelse || "ingen");

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
  window.location.href = "index.html";
}
