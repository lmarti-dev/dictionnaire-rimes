const CONSONNES = "[qwrtzpsdfghjklxcvbnmç]"


async function load_littre_zip(callback) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == XMLHttpRequest.DONE) {
      console.log("called the script")
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
  a = document.createElement("a")
  a.setAttribute("class", "mot list-group-item list-group-item-action d-flex flex-row")
  href = tup[0].replace(/,.*/gm, "")
  a.setAttribute("href", `https://www.littre.org/recherche?mot=${href.toLowerCase()}`)
  a.innerHTML = `<p class='ortho px-2 fw-bold'>${tup[0]}</p><p class='prono small px-2 text-primary'>${tup[1]}</p>`
  return a
}

var liste;

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
        console.log(liste.slice(1, 100))
      })
    })
  })
}


function same_ending(array) {
  const matcher = /a/
  return array.filter(item => item[0].match(matcher));
}

function figure_out_pron(array, word) {
  for (i = 0; i < array.length; i++) { console.log(i) }
}

function find_rimes(str) {
  // first match mot and get its prononciation
  return liste.slice(1, 100)
}


function process_search_value(v) {
  v = v.replace(/(\w)\1{1,}/, "$1", v)
  v = v.replace(new RegExp(`(${CONSONNES})e$`), "$1'", v)
  v = v.replace(new RegExp(`(${CONSONNES})[dtxg]$`), "$1", v)
  v = v.replace(/([ea]+)ux/, "$1u", v)
  v = v.replace(/m[ae]n[tdx]$/, "man", v)
  v = v.replace(/ienn/, "ièn", v)
  v = v.replace(/ien/, "iin", v)
  v = v.replace(/qu/, "k", v)
  v = v.replace(/ai/, "è", v)
  v = v.replace(/ge/, "je", v)
  v = v.replace(/c([aou])/, "k$1", v)
  v = v.replace(/c([iey'])/, "s$1", v)
  v = v.replace(/g(['iey])/, "j$1", v)
  v = v.replace(/ç/, "s", v)
  v = v.replace(/x/, "ks", v)
  return v


}

function setup_search() {
  var typingTimer;
  var doneTypingInterval = 100;

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
    mots = find_rimes(search.value)
    let pron = process_search_value(search.value)
    document.getElementById("pron").innerHTML = pron
    document.title = `Rimes - ${search.value}`
    for (i = 0; i < mots.length; i++) {
      results.appendChild(create_item_div_inner(mots[i]))
    }
  }

}

document.addEventListener('DOMContentLoaded', (event) => {
  setup_search()
  main()

});
