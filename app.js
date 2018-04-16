const DRAW_NS = "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0";
const FODP_MIME = "application/vnd.oasis.opendocument.presentation-flat-xml";

const fodptemplate = fetch("presentation.fodp")
    .then(d=>d.text())
    .then(t=>new DOMParser().parseFromString(t, "text/xml"));

function xmlReplace(node, search, replace) {
    if (node.nodeType === Node.TEXT_NODE) 
	node.data = node.data.replace(search, replace);
    for (let n of node.childNodes) xmlReplace(n, search, replace);
}

const app = new Vue({
  el: 'main',
  data: {
    started: false, 
    txt: '',
    fodp: null
  },
  computed: {
    slides: function() {
        return this.txt
	.replace(/(\.|\?|\!)\s+/g, "$1\n")
	.split("\n")
        .map(t=>t.trim())
        .filter(t=>t.length>0)
        .map((t,i)=>({
            num: i,
            contents: t
        }));
    },
  },
  methods: {
    onSubmit: function (event) {
        this.started = true;
        setTimeout(()=>Reveal.initialize(), 100);
    },
    onChange: function() {
        var that = this;
        fodptemplate.then(tplDoc => {
            let doc = tplDoc.cloneNode(true);
            let pages = doc.getElementsByTagNameNS(DRAW_NS, "page");
            let lastPage = pages[pages.length-1];
            let root = lastPage.parentElement;
            that.slides.forEach(slide => {
                let newPage = lastPage.cloneNode(true);
                xmlReplace(newPage, "{{contents}}", slide.contents);
                root.appendChild(newPage);
            });
            root.removeChild(lastPage);
            let xmlStr = new XMLSerializer().serializeToString(doc);
            let blob = new Blob([xmlStr], {type:FODP_MIME});
            that.fodp = URL.createObjectURL(blob);
        })
    }
  }
});
