const template = document.createElement('template');
template.innerHTML = `
<div>

    <div id="chooseFileDiv">
        <input id="uploadFile" type="file" accept="application/pdf" name="pdf" /><br/><br/>
    </div>
        
    <div id="scanDiv">
        <button id="scanButton">Scan</button>
        <button id="resetButton">Reset</button>
    </div>

    <div id="resultDiv">
        <label>Result:</label>
        <pre><code id="result"></code></pre>
    </div>

</div>
`;

class QrCodePdfAllScanner extends HTMLElement {
    constructor() {
        super();
    }

    render() {
        console.log('qrcode-pdf-all-scanner component is rendering');
        
        const shadowRoot = this.attachShadow({mode: 'closed'});
        // clone template content nodes to the shadow DOM
        shadowRoot.appendChild(template.content.cloneNode(true));

        function renderPdfPage(pdf, scale, pageNumber, canvas, callBackResult) {
            pdf.getPage(pageNumber).then(function(page) {
                console.log(page);

                var viewport = page.getViewport({ 
                    scale: scale 
                });

                canvas.height = viewport.height;
                canvas.width = viewport.width;
                    
                var renderTask = page.render({
                    canvasContext: canvas.getContext('2d'), 
                        viewport: viewport
                });
                
                renderTask.promise.then(function () {
                    // Pagina rendered                
                    callBackResult(canvas.toDataURL(), pageNumber);
                });
            });
        };

        function scanQRCode(qrCodeReader, image, callBackResult) {
            if (qrCodeReader && image) {
                qrCodeReader.decodeFromImage(undefined, image)
                    .then(result => {
                        console.log(result.text);
                        callBackResult(result.text);
                    }) 
                    .catch(err => {
                        console.error(err);
                        callBackResult("ERROR: " + err);
                    });
            }
        }

        shadowRoot.getElementById('scanButton').addEventListener('click', () => {
            var uploadFile = shadowRoot.getElementById('uploadFile');
            var pdfFile = URL.createObjectURL(uploadFile.files[0]);

            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = '../common/libs/pdfjs/build/pdf.worker.js';
            console.log('PdfJs initialized');

            const qrCodeReader = new ZXing.BrowserMultiFormatReader();
            console.log('ZXing code reader initialized');

            var loadingTask = pdfjsLib.getDocument(pdfFile);
            loadingTask.promise.then(function(pdf) {

                for(var page = 1; page <= pdf.numPages; page++) {
                    var canvas = document.createElement("canvas");    
                    canvas.style.visibility = "hidden";
                    renderPdfPage(pdf, 1, page, canvas, function callBackResult(imageFromPdf, pageNumberRendered) {
                        scanQRCode(qrCodeReader, imageFromPdf, function callBackResult(result) {
                            shadowRoot.getElementById('result').textContent += "Página " + pageNumberRendered + ": " + result + "\n";
                        });
                    });                    
                }
            });
        });

        shadowRoot.getElementById('resetButton').addEventListener('click', () => {
            shadowRoot.getElementById('uploadFile').value = "";
            shadowRoot.getElementById('result').textContent = "";
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
window.customElements.define('qrcode-pdf-all-scanner', QrCodePdfAllScanner);