const template = document.createElement('template');
template.innerHTML = `
<div>
    <div>
        <button id="startButton">Start</button>
        <button id="scanOnceButton">Scan Once</button>
        <button id="resetButton">Reset</button>
    </div>

    <div>
        <video id="video" width="300" height="200" style="border: 1px solid gray"></video>
    </div>
    
    <div id="sourceSelectPanel" style="display:none">
        <label for="sourceSelect">Change video source:</label>
        <select id="sourceSelect" style="max-width:400px">
        </select>
    </div>

    <label>Result:</label>
    <pre><code id="result"></code></pre>
</div>
`;

class QrCodeVideoScanner extends HTMLElement {
    constructor() {
        super();
    }

    render() {
        console.log('qrcode-video-scanner component is rendering');
        
        const shadowRoot = this.attachShadow({mode: 'closed'});
        // clone template content nodes to the shadow DOM
        shadowRoot.appendChild(template.content.cloneNode(true));

        window.addEventListener('load', function () {
            let selectedDeviceId;
            const qrCodeReader = new ZXing.BrowserMultiFormatReader();
            console.log('ZXing code reader initialized');
            
            qrCodeReader.listVideoInputDevices()
                .then((videoInputDevices) => {
                    const sourceSelect = shadowRoot.getElementById('sourceSelect');
                    selectedDeviceId = videoInputDevices[0].deviceId;

                    if (videoInputDevices.length >= 1) {
                        videoInputDevices.forEach((element) => {
                            const sourceOption = document.createElement('option');
                            sourceOption.text = element.label;
                            sourceOption.value = element.deviceId;
                            sourceSelect.appendChild(sourceOption);
                        })

                        sourceSelect.onchange = () => {
                            selectedDeviceId = sourceSelect.value;
                        };

                        const sourceSelectPanel = shadowRoot.getElementById('sourceSelectPanel')
                        sourceSelectPanel.style.display = 'block'
                    }

                    shadowRoot.getElementById('startButton').addEventListener('click', () => {
                        let videoElement = shadowRoot.querySelector('video');

                        qrCodeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
                            if (result) {
                                console.log(result);
                                shadowRoot.getElementById('result').textContent = result.text;
                            }
                            if (err && !(err instanceof ZXing.NotFoundException)) {
                                console.error(err)
                                shadowRoot.getElementById('result').textContent = err
                            }
                        })
                        console.log(`Started continous decode from camera with id ${selectedDeviceId}`)
                    })
                    
                    shadowRoot.getElementById('scanOnceButton').addEventListener('click', () => {
                        let videoElement = shadowRoot.querySelector('video');

                        qrCodeReader.decodeOnceFromVideoDevice(selectedDeviceId, videoElement)
                            .then(result => {
                                console.log(result);
                                shadowRoot.getElementById('result').textContent = result.text;
                                qrCodeReader.reset();
                            })
                            .catch(err => console.error(err));
                    });

                    shadowRoot.getElementById('resetButton').addEventListener('click', () => {
                        qrCodeReader.reset()
                        shadowRoot.getElementById('result').textContent = '';
                        console.log('Reset.')
                    });
                })
                .catch((err) => {
                    console.error(err)
                })
          })

    }

    connectedCallback() {
        console.log('qrcode-video-scanner Component added to DOM');
        this.render();
    }
}

// Setup
function dynamicallyLoadDependencies(url, type) {
    var script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL
    script.type = type; // type of script

    document.head.appendChild(script);  // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
}
dynamicallyLoadDependencies("./libs/@zxing/umd/index.min.js", "text/javascript");
// dynamicallyLoadDependencies("https://unpkg.com/@zxing/library@latest", "text/javascript"); podemos adicionar a dependencia direta da fonte

// Define the webcomponent tag name
window.customElements.define('qrcode-video-scanner', QrCodeVideoScanner);