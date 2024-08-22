const CONSONNES = "qwrtzpsdfghjklxcvbnmç"

// guess what \W contains? 
const VOYELLES_LETTRES = "aeyoui" + "àèìòù" + "áéíóúý" + "âêîôû" + "äëïöüÿ"

const CR = `[${CONSONNES}]`

const VOYELLES_ASSOC = "an|eu|in|on|un|oi|ou|oû"


const VOYELLES = VOYELLES_ASSOC + [...VOYELLES_LETTRES].map((e) => `|${e}`).join("")

const VR = `(?:${VOYELLES})`
const ONLYVOYELLES = new RegExp(`^${VR}+$`)
const ONLYCONSONNES = new RegExp(`^${CR}+'?$`)

var max_mots = 100;
var rimes;

var liste;
var current_search_value = ""

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



function create_result_list_item(tup) {
  let item = document.createElement("li")
  item.setAttribute("class", "mot list-group-item d-flex flex-row")
  slug = tup[0].replace(/(,| ou ).*/gm, "")
  href = `https://www.littre.org/recherche?mot=${slug.toLowerCase()}`
  item.innerHTML = `<a target='_blank' class='ortho px-2 fw-bold' href='${href}'>${tup[0]}</a><p class='prono small px-2 text-secondary'>${tup[1]}</p>`
  return item
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
  let pat = pron.replaceAll(new RegExp(CR, "g"), "c")
  pat = pat.replaceAll(new RegExp(VR, "g"), "v")
  return pat
}

function get_end_regex(pron) {
  if (ONLYVOYELLES.test(pron)) {
    return new RegExp(`${pron}$`)
  } else if (ONLYCONSONNES.test(pron)) {
    let pron_regex = pron.replace(/'?$/, "'?")
    return new RegExp(`${pron_regex}$`)
  }

  m = pron.match(new RegExp(`(${CR}+${VR}$)|(${VR}${CR}+'?$)`))
  console.log(m)
  if (m == null) { return /$/ }
  pron_end = m[0]
  pron_end_dashed = pron_end.replaceAll(new RegExp(`(${VR})(${CR})`, "g"), "$1\-?$2")
  pron_end_dashed = pron_end_dashed.replaceAll(new RegExp(`(${CR})(${VR})`, "g"), "$1\-?$2")
  pron_end_dashed = pron_end_dashed.replace(/'$/, "'?")
  let end_regex = new RegExp(`[${CONSONNES}-]${pron_end_dashed}$`)
  return end_regex
}

function ends_match(end_regex, pron) {
  return end_regex.test(pron)
}

function rime_avec(end_regex, liste_mots) {
  return liste_mots.filter(item => ends_match(end_regex, item[1]));
}

function find_rimes(pron, end_regex) {
  console.log(`${pron}: ${end_regex}`)
  return rime_avec(end_regex, liste)
}


function process_search_value(v) {
  v = v.replaceAll(/ +/g, "", v)

  // remplacer le e caduc par '
  v = v.replace(new RegExp(`(${CR})e$`), "$1'", v)
  // remplacer les dtxg muets par rien (dans ment z.b.)
  v = v.replace(new RegExp(`(${CR})[dtxg]$`), "$1", v)
  v = v.replace(new RegExp(`(${VR})s{1}'$`), "$1z'", v)



  // remplacer er par é
  v = v.replace(/er$/, "é", v)

  // oeu -> eu
  v = v.replaceAll(/œu/g, "eu", v)

  // 
  v = v.replaceAll(/ei/g, "è", v)

  // paître
  v = v.replaceAll(/aî/g, "ê", v)

  //  trépas, pas, 
  v = v.replace(/as$/, "a", v)

  // replacer bateaux -> bato
  v = v.replace(/([ea]+)u[x|d|t]$/, "$1u", v)

  // remplacer dément par déman
  v = v.replace(/m[ae]n[tdx]$/, "man", v)

  // remplacer chienne par chièn
  v = v.replaceAll(/enn/g, "èn", v)

  // remplacer ancien par aciin
  v = v.replaceAll(/ien/g, "iin", v)

  // g mou
  v = v.replaceAll(/g(['iey])/g, "j$1", v)

  // combinaisons
  v = v.replaceAll(/qu?/g, "k", v)
  v = v.replaceAll(/ai/g, "è", v)
  v = v.replaceAll(/en/g, "an", v)
  v = v.replaceAll(/e?au/g, "o", v)


  // c mou
  v = v.replaceAll(/c([íêéèyìiey'])/g, "s$1", v)
  // c dur
  v = v.replaceAll(/c(?!h)/g, "k", v)


  // misc
  v = v.replaceAll(/ç/g, "s", v)
  v = v.replaceAll(/x/g, "ks", v)


  // lettres répétées rr -> r
  v = v.replace(/(\w)\1{1,}/, "$1", v)

  return v


}


function add_rimes_to_content(shuffle = true) {
  // TODO: add shuffle
  for (i = 0; i < Math.min(rimes.length, max_mots); i++) {
    results.appendChild(create_result_list_item(rimes[i]))
  }
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

    if (search.value != current_search_value) {
      results.innerHTML = ""
      current_search_value = search.value;

      let pron = process_search_value(search.value)
      pron_box = document.getElementById("pron")

      if (pron != "") {
        let end_regex = get_end_regex(pron)
        rimes = find_rimes(pron, end_regex)
        pron_box.setAttribute("class", "small px-2 text-secondary")
        pron_box.innerHTML = `<span class'font-italic'>${pron}</span> ― <code>${end_regex}</code>`

        document.title = `Rimes - ${search.value}`
      } else {
        pron_box.innerHTML = ""
      }
      add_rimes_to_content()

    }
  }

}

document.addEventListener('DOMContentLoaded', (event) => {
  setup_search()
  main()

});
