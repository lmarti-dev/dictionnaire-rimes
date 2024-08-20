const CONSONNES = "qwrtzpsdfghjklxcvbnmç"

// guess what \W contains? 
const VOYELLES = "aeyoui" + "àèìòù" + "áéíóúý" + "âêîôû" + "äëïöüÿ"

const cr = `[${CONSONNES}]`
const vr = `[${VOYELLES}]`
const only_vowels = new RegExp(`^${vr}+$`)


var liste;

async function load_littre_zip(callback) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == XMLHttpRequest.DONE) {
      data = xhttp.response
      callback(data)
    }
  };
  xhttp.open("GET", "./files/littre_blurb.zip", true);
  xhttp.responseType = "arraybuffer";
  xhttp.overrideMimeType("text/plain; charset=x-user-defined");
  xhttp.send();
  xhttp.onreadystatechange()
}


function create_item_div(tup) {
  div = document.createElement("div")
  div.setAttribute("class", "mot")
  p1 = document.createElement("p")
  p1.setAttribute("class", "ortho")
  p1.innerHTML = tup[0]
  p2 = document.createElement("p")
  p2.setAttribute("class", "prono")
  p2.innerHTML = tup[1]

  div.appendChild(p1)
  div.appendChild(p2)
  return div


}

function create_item_div_inner(tup) {
  div = document.createElement("div")
  div.setAttribute("class", "mot list-group-item list-group-item-action d-flex flex-row")
  slug = tup[0].replace(/(,| ou ).*/gm, "")
  href = `https://www.littre.org/recherche?mot=${slug.toLowerCase()}`
  div.innerHTML = `<a target='_blank' class='ortho px-2 fw-bold' href='${href}'>${tup[0]}</a><p class='prono small px-2 text-secondary'>${tup[1]}</p>`
  return div
}


function is_consonne(char) {
  return CONSONNES.indexOf(c) > -1
}

async function main() {
  var zip = new JSZip();
  await load_littre_zip(response => {

    var responseArray = new Uint8Array(response);
    var blobData = new Blob([responseArray], {
      type: 'application/zip'
    });
    zip.loadAsync(response).then(function (zip) {
      zip.file("littre_blurb.json").async("text").then(jobj => {
        liste = JSON.parse(jobj)
      })
    })
  })
}



function to_pattern(pron) {
  let pat = pron.replaceAll(new RegExp(cr, "g"), "c")
  pat = pat.replaceAll(new RegExp(vr, "g"), "v")
  return pat
}

function get_end_regex(pron) {
  if (only_vowels.test(pron)) {
    return new RegExp(`${pron}$`)
  }
  let pat = to_pattern(pron)
  m = pat.match(/(c+v+|v+c+'?)$/)
  if (m == null) { return /$/ }
  pron_end = pron.slice(m.index)
  pron_end_dashed = pron_end.replaceAll(new RegExp(`(${vr})(${cr}|${cr}|${vr})`, "g"), "$1-?$2")
  let end_regex = new RegExp(`[${CONSONNES}-]${pron_end_dashed}$`)
  return end_regex
}

function ends_match(end_regex, pron) {
  return end_regex.test(pron)
}

function rime_avec(end_regex, liste_mots) {
  return liste_mots.filter(item => ends_match(end_regex, item[1]));
}

function find_rimes(pron) {
  let end_regex = get_end_regex(pron)

  console.log(`${pron}: ${end_regex}`)
  return rime_avec(end_regex, liste)
}


function process_search_value(v) {

  // consonnes répétées rr -> r
  v = v.replace(/(\w)\1{1,}/, "$1", v)

  // remplacer le e caduc par '
  v = v.replace(new RegExp(`(${cr})e$`), "$1'", v)
  // remplacer les dtxg muets par rien (dans ment z.b.)
  v = v.replace(new RegExp(`(${cr})[dtxg]$`), "$1", v)
  v = v.replace(new RegExp(`(${vr})s'$`), "$1z'", v)

  // remplacer er par é
  v = v.replace(/er$/, "é", v)

  // replacer bateaux -> bato
  v = v.replace(/([ea]+)ux/, "$1u", v)

  // remplacer dément par déman
  v = v.replace(/m[ae]n[tdx]$/, "man", v)

  // remplacer chienne par chièn
  v = v.replace(/ienn/, "ièn", v)

  // remplacer ancien par aciin
  v = v.replace(/ien/, "iin", v)

  // combinaisons
  v = v.replace(/qu/, "k", v)
  v = v.replace(/ai/, "è", v)
  v = v.replace(/au/, "o", v)

  // c dur
  v = v.replace(/c([aou])/, "k$1", v)

  // c mou
  v = v.replace(/c([iey'])/, "s$1", v)

  // g mou
  v = v.replace(/g(['iey])/, "j$1", v)

  // misc
  v = v.replace(/ç/, "s", v)
  v = v.replace(/x/, "ks", v)
  return v


}

function setup_search() {
  var typingTimer;
  var doneTypingInterval = 300;

  search = document.getElementById("search-form")
  results = document.getElementById("results")

  search.addEventListener('keyup', function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  });

  search.addEventListener('keydown', function () {
    clearTimeout(typingTimer);
  });

  function doneTyping() {
    results.innerHTML = ""

    let pron = process_search_value(search.value)
    mots = find_rimes(pron)
    pron_box = document.getElementById("pron")
    pron_box.setAttribute("class", "small px-2 text-secondary")
    pron_box.innerHTML = pron

    document.title = `Rimes - ${search.value}`
    for (i = 0; i < Math.min(mots.length, 100); i++) {
      results.appendChild(create_item_div_inner(mots[i]))
    }
  }

}

document.addEventListener('DOMContentLoaded', (event) => {
  setup_search()
  main()

});
