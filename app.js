document.addEventListener('DOMContentLoaded', () => {
    // List of standard text inputs for syncing and saving
    const textInputs = [
        'gatto1_nome', 'gatto1_razza', 'gatto1_nascita',
        'gatto2_nome', 'gatto2_razza', 'gatto2_nascita',
        'gatto3_nome', 'gatto3_razza', 'gatto3_nascita',
        'veterinario', 'veterinario_recapito', 'farmaci',
        'proprietario', 'codice_fiscale', 'cellulare', 'email',
        'comune', 'indirizzo', 'scala', 'piano',
        'periodo_dal', 'periodo_al', 'luogo_data',
        'passaggi_1_dettaglio', 'passaggi_2_dettaglio'
    ];

    // Dropdown fields
    const selectInputs = [
        'gatto1_sesso', 'gatto2_sesso', 'gatto3_sesso'
    ];

    // Reference to canvases for global reset
    let canvas1, canvas2;

    // Initialize application
    function init() {
        // Setup signature pads
        canvas1 = setupSignaturePad('sigCanvas1', 'imgSig1');
        canvas2 = setupSignaturePad('sigCanvas2', 'imgSig2');

        // Bind synchronization events to text inputs
        textInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    syncField(id, input.value);
                    saveProfile();
                });
            }
        });

        // Bind synchronization events to select inputs
        selectInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => {
                    syncField(id, input.value);
                    saveProfile();
                });
            }
        });

        // Bind character text area separately (requires line splitting)
        const inputCarattere = document.getElementById('carattere');
        if (inputCarattere) {
            inputCarattere.addEventListener('input', () => {
                syncCarattere(inputCarattere.value);
                saveProfile();
            });
        }

        // Bind passaggi checkboxes
        const cb1 = document.getElementById('passaggi_1');
        const cb2 = document.getElementById('passaggi_2');
        [cb1, cb2].forEach(cb => {
            if (cb) {
                cb.addEventListener('change', () => {
                    syncPassaggi();
                    saveProfile();
                });
            }
        });

        // Action buttons
        const btnPrint = document.getElementById('btnPrintPdf');
        if (btnPrint) btnPrint.addEventListener('click', printDocument);

        const btnReset = document.getElementById('btnResetFields');
        if (btnReset) btnReset.addEventListener('click', resetFields);

        const btnClearStorage = document.getElementById('btnClearStorage');
        if (btnClearStorage) btnClearStorage.addEventListener('click', clearStorage);

        // Load profile if stored
        loadProfile();
    }

    // Synchronize basic fields to document preview
    function syncField(id, value) {
        const docField = document.getElementById(`doc_${id}`);
        if (docField) {
            const displayValue = value.trim();
            if (displayValue === '') {
                docField.innerHTML = '&nbsp;';
            } else {
                docField.textContent = displayValue;
            }
        }
    }

    // Split comportamento details across two A4 lines to avoid overlap
    function syncCarattere(value) {
        const line1 = document.getElementById('doc_carattere_line1');
        const line2 = document.getElementById('doc_carattere_line2');
        if (!line1 || !line2) return;

        const text = value.trim();
        if (text === '') {
            line1.innerHTML = '&nbsp;';
            line2.innerHTML = '&nbsp;';
            return;
        }

        const maxLen = 68; // comfortable character length for A4 boxes
        if (text.length <= maxLen) {
            line1.textContent = text;
            line2.innerHTML = '&nbsp;';
        } else {
            // Find optimal split point near maxLen
            let splitIndex = text.lastIndexOf(' ', maxLen);
            if (splitIndex === -1 || splitIndex < 20) {
                splitIndex = maxLen; // fallback if no spaces
            }

            const part1 = text.substring(0, splitIndex).trim();
            const part2 = text.substring(splitIndex).trim();

            line1.textContent = part1;
            line2.textContent = part2.substring(0, maxLen); // cap line 2 as well
        }
    }

    // Update Daily visits selection (renders an X over the box when active)
    function syncPassaggi() {
        const docBox1 = document.getElementById('doc_passaggi_1');
        const docBox2 = document.getElementById('doc_passaggi_2');
        if (!docBox1 || !docBox2) return;

        const cb1 = document.getElementById('passaggi_1');
        const cb2 = document.getElementById('passaggi_2');

        if (cb1 && cb1.checked) {
            docBox1.classList.add('active');
        } else {
            docBox1.classList.remove('active');
        }

        if (cb2 && cb2.checked) {
            docBox2.classList.add('active');
        } else {
            docBox2.classList.remove('active');
        }
    }

    // Canvas drawing coordinates math, scaling bounding rect for responsive canvases
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        if (evt.touches && evt.touches.length > 0) {
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        } else {
            clientX = evt.clientX;
            clientY = evt.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // Setup digital signature canvas logic
    function setupSignaturePad(canvasId, imgPreviewId) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const imgPreview = document.getElementById(imgPreviewId);

        let isDrawing = false;
        let lastPos = { x: 0, y: 0 };

        // Set signature design (deep blue ink simulation)
        ctx.strokeStyle = '#0F2C59';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        function startDrawing(e) {
            isDrawing = true;
            lastPos = getMousePos(canvas, e);
            e.preventDefault();
        }

        function draw(e) {
            if (!isDrawing) return;
            const pos = getMousePos(canvas, e);

            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            lastPos = pos;
            e.preventDefault();
        }

        // Generate image data URL and sync it to the printable PDF preview
        function stopDrawing() {
            if (!isDrawing) return;
            isDrawing = false;

            const dataURL = canvas.toDataURL('image/png');
            imgPreview.src = dataURL;
            imgPreview.classList.remove('hidden');
        }

        // Mouse inputs
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);

        // Mobile touch inputs
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        // Reset capability
        canvas.clear = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            imgPreview.src = '';
            imgPreview.classList.add('hidden');
        };

        // Clear button hookup
        const clearBtnId = canvasId === 'sigCanvas1' ? 'btnClearSig1' : 'btnClearSig2';
        const clearBtn = document.getElementById(clearBtnId);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                canvas.clear();
            });
        }

        return canvas;
    }

    // Auto-save form contents locally (excluding transient digital signatures)
    function saveProfile() {
        const profile = {};

        textInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) profile[id] = el.value;
        });

        selectInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) profile[id] = el.value;
        });

        const elCarattere = document.getElementById('carattere');
        if (elCarattere) profile['carattere'] = elCarattere.value;

        const cb1 = document.getElementById('passaggi_1');
        const cb2 = document.getElementById('passaggi_2');
        profile['passaggi_1'] = cb1 ? cb1.checked : false;
        profile['passaggi_2'] = cb2 ? cb2.checked : false;

        localStorage.setItem('albergatto_profile', JSON.stringify(profile));
    }

    // Load form contents from browser storage
    function loadProfile() {
        const stored = localStorage.getItem('albergatto_profile');
        if (!stored) {
            // Set default passaggi on fresh load
            syncPassaggi();
            return;
        }

        try {
            const profile = JSON.parse(stored);

            textInputs.forEach(id => {
                const el = document.getElementById(id);
                if (el && profile[id] !== undefined) {
                    el.value = profile[id];
                    syncField(id, profile[id]);
                }
            });

            selectInputs.forEach(id => {
                const el = document.getElementById(id);
                if (el && profile[id] !== undefined) {
                    el.value = profile[id];
                    syncField(id, profile[id]);
                }
            });

            const elCarattere = document.getElementById('carattere');
            if (elCarattere && profile['carattere'] !== undefined) {
                elCarattere.value = profile['carattere'];
                syncCarattere(profile['carattere']);
            }

            if (profile['passaggi_1'] !== undefined) {
                const cb1 = document.getElementById('passaggi_1');
                if (cb1) cb1.checked = profile['passaggi_1'];
            } else if (profile['passaggi'] === '1' || profile['passaggi'] === 1) {
                const cb1 = document.getElementById('passaggi_1');
                if (cb1) cb1.checked = true;
            }

            if (profile['passaggi_2'] !== undefined) {
                const cb2 = document.getElementById('passaggi_2');
                if (cb2) cb2.checked = profile['passaggi_2'];
            } else if (profile['passaggi'] === '2' || profile['passaggi'] === 2) {
                const cb2 = document.getElementById('passaggi_2');
                if (cb2) cb2.checked = true;
            }

            syncPassaggi();

        } catch (e) {
            console.error("Error loading saved profile from localStorage:", e);
        }
    }

    // Reset current form view but retain localStorage data
    function resetFields() {
        if (confirm("Vuoi svuotare tutti i campi correnti dell'anteprima? Questo non eliminerà il profilo salvato sul browser, ma ripulirà la schermata di compilazione attuale.")) {
            document.getElementById('catSittingForm').reset();
            
            // Clean out all synced cells in document
            textInputs.forEach(id => syncField(id, ''));
            selectInputs.forEach(id => syncField(id, ''));
            syncCarattere('');
            syncPassaggi();

            // Wipe drawing canvas signatures
            if (canvas1) canvas1.clear();
            if (canvas2) canvas2.clear();
        }
    }

    // Clear localStorage and wipe current screen
    function clearStorage() {
        if (confirm("Sei sicuro di voler eliminare definitivamente tutti i dati personali salvati sul browser? Dovrai ricompilarli da zero la prossima volta.")) {
            localStorage.removeItem('albergatto_profile');
            document.getElementById('catSittingForm').reset();

            textInputs.forEach(id => syncField(id, ''));
            selectInputs.forEach(id => syncField(id, ''));
            syncCarattere('');
            syncPassaggi();

            if (canvas1) canvas1.clear();
            if (canvas2) canvas2.clear();

            alert("Dati salvati eliminati con successo.");
        }
    }

    // Browser's native printing
    function printDocument() {
        const sig1Empty = document.getElementById('imgSig1').classList.contains('hidden');
        const sig2Empty = document.getElementById('imgSig2').classList.contains('hidden');
        
        if (sig1Empty || sig2Empty) {
            if (!confirm("Attenzione: Uno o entrambi i campi firma sono vuoti. Desideri comunque procedere con la stampa/salvataggio?")) {
                return;
            }
        }
        
        window.print();
    }



    // Start execution
    init();
});
