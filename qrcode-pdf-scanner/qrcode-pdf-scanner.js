const template = document.createElement('template');
template.innerHTML = `
<div>

    <div id="chooseFileDiv">
        <input id="uploadFile" type="file" accept="application/pdf" name="pdf" /><br/><br/>
    </div>
        
    <div id="scanDiv" style="visibility: hidden;">
        <canvas id="canvasPdf" style="border: 1px solid gray"></canvas></br>
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
        
        const shadowRoot = this.attachShadow({mode: 'open'});
        // clone template content nodes to the shadow DOM
        shadowRoot.appendChild(template.content.cloneNode(true));
        var pdfFile;
        var imageFromPdf;

        shadowRoot.getElementById('uploadFile').addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                pdfFile = URL.createObjectURL(event.target.files[0]);

                // Transformar pdf to image
                var pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = '../common/libs/pdfjs/build/pdf.worker.js';
            
                var loadingTask = pdfjsLib.getDocument(pdfFile);
                loadingTask.promise.then(function(pdf) {
                    console.log(pdf);
                    console.log('number of pages' + pdf.numPages);

                    // TODO: Implementar o loop nas paginas, assim percorremos todas as paginas buscando pelos qrCodes
                    pdf.getPage(1).then(function(page) {
                        var viewport = page.getViewport({
                            scale: 1 
                        });

                        var canvas = shadowRoot.getElementById('canvasPdf');
                        var canvasCtx = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        var render_context = {
                            canvasContext: canvasCtx,
                            viewport: viewport
                        };

                        var renderTask = page.render(render_context);
                        renderTask.promise.then(function () {
                            // Pagina rendered
                            imageFromPdf = canvas.toDataURL();
                        });
                    });
                });

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
// dynamicallyLoadDependencies("https://unpkg.com/@zxing/library@latest", "text/javascript"); podemos adicionar a dependencia direta da fonte
dynamicallyLoadDependencies("../common/libs/@zxing/umd/index.min.js", "text/javascript");
dynamicallyLoadDependencies("../common/libs/pdfjs/build/pdf.js", "text/javascript");

// Define the webcomponent tag name
window.customElements.define('qrcode-pdf-scanner', QrCodePdfScanner);