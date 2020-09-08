const template = document.createElement('template');
template.innerHTML = `
<div>

    <div id="chooseFileDiv">
        <input id="uploadFile" type="file" accept="application/pdf" name="pdf" /><br/><br/>
    </div>
        
    <div id="scanDiv" style="visibility: hidden;">
        <button id="scanButton">Scan</button>
        <button id="resetButton">Reset</button>

        <br/><br/>
        <label>Result:</label>
        <pre><code id="result"></code></pre>
    </div>

</div>
`;

class QrCodePdfScanner extends HTMLElement {
    constructor() {
        super();
    }

    render() {
        console.log('qrcode-pdf-scanner component is rendering');
        
        const shadowRoot = this.attachShadow({mode: 'closed'});
        // clone template content nodes to the shadow DOM
        shadowRoot.appendChild(template.content.cloneNode(true));
        var pdfFile;
        var imageFromPdf;

        shadowRoot.getElementById('uploadFile').addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                pdfFile = URL.createObjectURL(event.target.files[0]);

                // Transformar pdf to image
                imageFromPdf = null;

                var scanDiv = shadowRoot.getElementById('scanDiv');
                scanDiv.style.visibility = "visible";                
            }
        });

        window.addEventListener('load', function () {
            const qrCodeReader = new ZXing.BrowserMultiFormatReader();
            console.log('ZXing code reader initialized');

            shadowRoot.getElementById('scanButton').addEventListener('click', () => {
                if (imageFromPdf) {
                    qrCodeReader.decodeFromImage(undefined, imageFromPdf)
                        .then(result => {
                            console.log(result.text);
                            shadowRoot.getElementById('result').textContent = result.text;
                        }) 
                        .catch(err => {
                            console.error(err);
                            shadowRoot.getElementById('result').textContent = "ERROR: " + err;
                        });
                }
            });

            shadowRoot.getElementById('resetButton').addEventListener('click', () => {
                var scanDiv = shadowRoot.getElementById('scanDiv');
                scanDiv.style.visibility = "hidden";
                shadowRoot.getElementById('uploadFile').value = "";
                shadowRoot.getElementById('result').textContent = "";

                imageFromPdf = undefined;
                pdfFile = undefined;
            })
        });

    }

    connectedCallback() {
        console.log('qrcode-pdf-scanner Component added to DOM');
        this.render();
    }
}

// Setup
function dynamicallyLoadDependencies(url, type) {
    // Verifica se o script ja foi adicionado, senao adiciona
    if (!document.querySelector(`script[src="${url}"]`)) {
        var script = document.createElement("script"); 
        script.src = url;
        script.type = type;
        
        document.head.appendChild(script);
    }
}
dynamicallyLoadDependencies("../common/libs/@zxing/umd/index.min.js", "text/javascript");
// dynamicallyLoadDependencies("https://unpkg.com/@zxing/library@latest", "text/javascript"); podemos adicionar a dependencia direta da fonte

// Define the webcomponent tag name
window.customElements.define('qrcode-pdf-scanner', QrCodeImageScanner);