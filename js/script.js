//  plus de rimes avec o ne marche pas....
// et BOOTstrap ne centre pas le div#content


const CONSONNES_LETTRES = "qwrtzpsdfghjklxcvbnmç"
const CONSONNES_ASSOC = "ch"
const CONSONNES = CONSONNES_ASSOC + [...CONSONNES_LETTRES].map((e) => `|${e}`).join("")
const CR = `(?:${CONSONNES})`

// guess what \W contains? 
const VOYELLES_LETTRES = "aeyoui" + "àèìòù" + "áéíóúý" + "âêîôû" + "äëïöüÿ"
const VOYELLES_ASSOC = "an|eu|in|on|un|oi|ou|oû"
const VOYELLES = VOYELLES_ASSOC + [...VOYELLES_LETTRES].map((e) => `|${e}`).join("")
const VR = `(?:${VOYELLES})`


const ONLYVOYELLES = new RegExp(`^${VR}+$`)
const ONLYCONSONNES = new RegExp(`^${CR}+'?$`)


const FILE_TO_LOAD = "littre_blurb_sorted"

const DEFAULT_MAX_RIMES = 100
const MORE_RIMES = 100
var current_rimes = 0
var rimes;

var liste;
var current_search_value = "";

async function load_littre_zip(callback) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == XMLHttpRequest.DONE) {
      data = xhttp.response
      callback(data)
    }
  };
  xhttp.open("GET", `./files/${FILE_TO_LOAD}.zip`, true);
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
  return CONSONNES_LETTRES.indexOf(c) > -1
}

async function main() {
  var zip = new JSZip();
  await load_littre_zip(response => {

    var responseArray = new Uint8Array(response);
    var blobData = new Blob([responseArray], {
      type: 'application/zip'
    });
    zip.loadAsync(response).then(function (zip) {
      zip.file(`${FILE_TO_LOAD}.json`).async("text").then(jobj => {
        liste = JSON.parse(jobj)
        setup_search()
      })
    })
  })
}


function include_close_sounds(pat) {
  pat = pat.replaceAll(/[êè]/g, "(ê|è)")
  pat = pat.replaceAll(/[oô](?![uinû])/g, "(o|ô)")
  pat = pat.replaceAll(/[aâ](?![in])/g, "(a|â)")
  return pat
}

function to_pattern(pron) {
  let pat = pron.replaceAll(new RegExp(CR, "g"), "c")
  pat = pat.replaceAll(new RegExp(VR, "g"), "v")
  return pat
}

function get_end_regex(pron) {
  if (ONLYVOYELLES.test(pron)) {
    // éviter qu'"i" rime avec "ai" ou "oi"
    return new RegExp(`(?<!${VR})${pron}$`)
  } else if (ONLYCONSONNES.test(pron)) {
    let pron_regex = pron.replace(/'?$/, "'?")
    return new RegExp(`${pron_regex}$`)
  }

  m = pron.match(new RegExp(`(${CR}+${VR}+$)|(${VR}+${CR}+'?$)`))
  if (m == null) { return /$/ }
  pron_end = m[0]
  penultieme_syllabe = pron.slice(0, m.index).match(new RegExp(`(${CR}|${VR})$`))
  pron_end_dashed = pron_end.replaceAll(new RegExp(`(${VR}|${CR})(?!$)`, "g"), "$1\-?")

  // ugly but the only way to get ch to have precedence over c
  pron_end_dashed = pron_end_dashed.replaceAll(/-[?]'$/g, "'")
  let end_regex;
  if (penultieme_syllabe != null) { end_regex = `(${penultieme_syllabe[0]}|-)?${pron_end_dashed}$` }
  else { end_regex = `${pron_end_dashed}$` }
  end_regex = new RegExp(include_close_sounds(end_regex))
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

  // remove spaces in word
  v = v.replaceAll(/ +/g, "", v)

  // remplacer le e caduc par '
  v = v.replace(new RegExp(`(${CR})e$`), "$1'", v)
  // remplacer les dtxg muets par rien (dans ment z.b.)
  v = v.replace(new RegExp(`(${CR})[dtxg]$`), "$1", v)
  v = v.replace(new RegExp(`(${VR})s{1}'$`), "$1z'", v)

  // ll mouillées
  v = v.replaceAll(new RegExp(`(${VR})ill`, "g"), "$1£", v)
  v = v.replaceAll(new RegExp(`(?!i)ll`, "g"), "l", v)


  // ph à f
  v = v.replaceAll(new RegExp(`ph`, "g"), "f", v)

  // remplacer er par é
  v = v.replace(/er$/, "é", v)

  // oeu -> eu
  v = v.replaceAll(/œu/g, "eu", v)

  // 
  v = v.replaceAll(/ei/g, "è", v)

  // paître
  v = v.replaceAll(/aî/g, "ê", v)

  // paît doit
  v = v.replace(/([oa]i)t$/, "$1", v)

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

  // ch dur
  v = v.replaceAll(/chr/g, "kr", v)


  // misc
  v = v.replaceAll(/ç/g, "s", v)
  v = v.replaceAll(/x/g, "ks", v)


  // lettres répétées rr -> r
  v = v.replace(/(\w)\1{1,}/, "$1", v)

  // but back the ll in
  v = v.replaceAll(/£/g, "ll", v)

  return v


}


function append_rimes_to_content() {
  results = document.getElementById("results")
  for (i = current_rimes; i < Math.min(rimes.length, current_rimes + DEFAULT_MAX_RIMES); i++) {
    results.appendChild(create_result_list_item(rimes[i]))
  }
}
function click_for_more_rimes() {
  let add_more = document.getElementById("more-results")
  current_rimes += MORE_RIMES
  append_rimes_to_content()
  if (rimes.length <= current_rimes + DEFAULT_MAX_RIMES) {
    add_more.setAttribute("style", "display:none;")
  }

}


function manage_more_rimes() {
  let add_more = document.getElementById("more-results")
  if (rimes.length > current_rimes + DEFAULT_MAX_RIMES) {
    add_more.removeAttribute("style")
    add_more.addEventListener("click",
      click_for_more_rimes
    )
  }

}

function setup_search() {
  var typingTimer;
  var doneTypingInterval = 300;

  search = document.getElementById("search-form")
  search.removeAttribute("disabled")
  search.setAttribute("placeholder", "Chercher...")
  results = document.getElementById("results")

  search.addEventListener('keyup', function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  });

  search.addEventListener('keydown', function () {
    clearTimeout(typingTimer);
  });

  function doneTyping() {
    current_rimes = 0
    if (search.value != current_search_value) {
      let add_more = document.getElementById("more-results")
      add_more.setAttribute("style", "display:none;")
      results.innerHTML = "";
      current_search_value = search.value;

      let pron = process_search_value(search.value)
      let info_line = document.getElementById("info-line")

      if (pron != "") {
        let end_regex = get_end_regex(pron)
        rimes = find_rimes(pron, end_regex)
        info_line.setAttribute("class", "small px-2 text-secondary")
        info_line.innerHTML = `<span class'font-italic'>${pron}</span> ― <code>${end_regex.toString().replace(/\</, "&lt;")}</code>
      </code>  ― <span>${rimes.length}</span> résultats`

        document.title = `Rimes - ${search.value} `
      } else {
        info_line.innerHTML = ""
      }
      append_rimes_to_content()
      manage_more_rimes()
    }
  }

}

function is_hidden(div) {
  return div["style"]["display"] == "none"
}

function set_apropos() {
  let apropos_btn = document.getElementById("a-propos-btn");
  let apropos = document.getElementById("a-propos");
  let content = document.getElementById("content");

  apropos_btn.addEventListener("click", () => {

    if (is_hidden(apropos) && !is_hidden(content)) {
      // show apropos
      apropos.removeAttribute("style");
      content.setAttribute("style", "display:none;");
      apropos_btn.innerHTML = "Retour"
    } else if (!is_hidden(apropos) && is_hidden(content)) {
      // hide apropos
      content.removeAttribute("style");
      apropos.setAttribute("style", "display:none;");
      apropos_btn.innerHTML = "À propos"
    } else {
      // in case reset to hide apropos
      content.removeAttribute("style");
      apropos.setAttribute("style", "display:none;");
      apropos_btn.innerHTML = "À propos"
    }

  })
}

document.addEventListener('DOMContentLoaded', (event) => {
  main()
  set_apropos()
});
