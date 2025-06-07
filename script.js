
        // Plant Gallery Configuration
        const PLANTS_CONFIG = {
            baseImagePath: './piante/', // Percorso base per le immagini delle piante
            plants: [  {
                    id: "acmella-repens",
                    name: "Acmella Repens",
                    latinName: "acmella repens",
                    category: "fondo",
                    image: "fondo\\acmella-repens.png",
                    link: "",
                    imageType: "site"
                }]
        };

        // Main Application
        const AcquarioLayoutDesigner = (() => {
            // Canvas and fabric.js initialization
           const canvas = new fabric.Canvas('canvas', {
    width: 1152, height: 864, backgroundColor: '#ffffff'
});
            
            // State management
            let currentTool = 'select';
            let layers = [];
            let history = [];
            let historyIndex = -1;
            const maxHistoryStates = 30;
            let isErasing = false;
            let eraserSize = 20;
            let lastEraserX = 0;
            let lastEraserY = 0;
            let activeImageForErasing = null;
            // Variabili per la matita
            let isPencilDrawing = false;
            let pencilSize = 3;
            let pencilColor = '#000000';
            let currentPath = null;
            // Variabili per la galleria piante
            let selectedPlant = null;
            let selectedLayerId = null;
            
            // Initialize the application
            function init() {
                setupEventListeners();
                setupTools();
                resizeCanvas();
                initializeHistory();
                showToast('success', 'Acquario Layout Designer avviato con successo!');
            }
            
            // Set up event listeners
            function setupEventListeners() {

            // Keyboard events
window.addEventListener('keydown', handleKeyDown);

// Context menu (right-click)
canvas.upperCanvasEl.addEventListener('contextmenu', handleContextMenu);


                // Window resize
                window.addEventListener('resize', resizeCanvas);
                
                // Tool buttons
                document.getElementById('select-tool').addEventListener('click', () => setTool('select'));
                document.getElementById('eraser-tool').addEventListener('click', () => setTool('eraser'));
                document.getElementById('remove-bg-tool').addEventListener('click', () => setTool('remove-bg'));
                
                // Layer and image buttons
                document.getElementById('add-image-btn').addEventListener('click', showAddImageDialog);
                document.getElementById('add-plant-btn').addEventListener('click', showPlantGalleryDialog);
                document.getElementById('add-layer-btn').addEventListener('click', showAddImageDialog);
                document.getElementById('delete-layer-btn').addEventListener('click', deleteSelectedLayer);
                document.getElementById('move-up-btn').addEventListener('click', moveLayerUp);
                document.getElementById('move-down-btn').addEventListener('click', moveLayerDown);
                document.getElementById('group-btn').addEventListener('click', groupLayers);
                document.getElementById('ungroup-btn').addEventListener('click', ungroupLayers);
                
                // History buttons
                document.getElementById('undo-btn').addEventListener('click', undo);
                document.getElementById('redo-btn').addEventListener('click', redo);
                
                // Export button
                document.getElementById('export-btn').addEventListener('click', showExportDialog);
                                
                // Add image dialog
                document.getElementById('add-image-close').addEventListener('click', hideAddImageDialog);
                document.getElementById('add-image-cancel').addEventListener('click', hideAddImageDialog);
                document.getElementById('add-image-confirm').addEventListener('click', addImageFromDialog);

                // Plant gallery dialog
                document.getElementById('plant-gallery-close').addEventListener('click', hidePlantGalleryDialog);
                document.getElementById('plant-gallery-cancel').addEventListener('click', hidePlantGalleryDialog);
                document.getElementById('plant-gallery-confirm').addEventListener('click', addPlantFromGallery);
                document.getElementById('plant-search').addEventListener('input', filterPlants);
                
                // Plant category tabs
                document.querySelectorAll('.plant-tab').forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        document.querySelectorAll('.plant-tab').forEach(t => t.classList.remove('active'));
                        e.target.classList.add('active');
                        filterPlants();
                    });
                });

                // Pencil tool button
                document.getElementById('pencil-tool').addEventListener('click', () => setTool('pencil'));

// Pencil settings
                document.getElementById('pencil-size-slider').addEventListener('input', updatePencilSize);
                document.getElementById('pencil-color-picker').addEventListener('input', updatePencilColor);

                // Remove background dialog
                document.getElementById('remove-bg-close').addEventListener('click', hideRemoveBgDialog);
                document.getElementById('remove-bg-cancel').addEventListener('click', hideRemoveBgDialog);
                document.getElementById('remove-bg-confirm').addEventListener('click', applyRemoveBackground);
                
                // Export dialog
                document.getElementById('export-close').addEventListener('click', hideExportDialog);
                document.getElementById('export-cancel').addEventListener('click', hideExportDialog);
                document.getElementById('export-confirm').addEventListener('click', exportLayout);
                
                // Eraser settings
                document.getElementById('eraser-size-slider').addEventListener('input', updateEraserSize);
                
                // Remove background settings
                document.getElementById('threshold-slider').addEventListener('input', updateThresholdPreview);
                document.getElementById('tolerance-slider').addEventListener('input', updateThresholdPreview);
                document.getElementById('bg-removal-mode').addEventListener('change', updateThresholdPreview);
                
                // Export quality slider
                document.getElementById('export-quality').addEventListener('input', updateQualityValue);

                // Background button
                document.getElementById('set-background-btn').addEventListener('click', showBackgroundDialog);

                // Background dialog
                document.getElementById('background-close').addEventListener('click', hideBackgroundDialog);
                document.getElementById('background-cancel').addEventListener('click', hideBackgroundDialog);
                document.getElementById('background-confirm').addEventListener('click', applyBackground);
                document.getElementById('background-type').addEventListener('change', toggleBackgroundControls);

                // Color synchronization
                document.getElementById('background-color').addEventListener('input', updateHexInput);
                document.getElementById('background-color-hex').addEventListener('input', updateColorInput);
                
                // Canvas events
                canvas.on('mouse:down', onCanvasMouseDown);
                canvas.on('mouse:move', onCanvasMouseMove);
                canvas.on('mouse:up', onCanvasMouseUp);
                canvas.on('object:modified', onObjectModified);
                canvas.on('selection:created', onSelectionCreated);
                canvas.on('selection:updated', onSelectionCreated);
                canvas.on('selection:cleared', onSelectionCleared);
            }
            
            // Set up tools and options
            function setupTools() {
    // Set initial tool
    setTool('select');

    // Setup eraser size
    updateEraserSize();
}

            
            // Resize canvas to fit container
            function resizeCanvas() {
                const container = document.querySelector('.canvas-container');
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                
                // Set canvas size (maintaining aspect ratio)
                const scaleFactor = Math.min(
                    (containerWidth - 40) / canvas.getWidth(),
                    (containerHeight - 40) / canvas.getHeight()
                );
                
                const canvasWrapper = document.getElementById('canvas-wrapper');
                canvasWrapper.style.transform = `scale(${scaleFactor})`;
                
                // Update zoom info
                document.getElementById('zoom-info').textContent = `Zoom: ${Math.round(scaleFactor * 100)}%`;
            }
            
            // Initialize history
            function initializeHistory() {
                addHistoryState();
            }
            
            // Set current tool
            // Set current tool
            function setTool(tool) {
                currentTool = tool;

                // Update UI
                document.querySelectorAll('.tool-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.getElementById(`${tool}-tool`).classList.add('active');

                // Nascondi tutti i pannelli di opzioni
                document.getElementById('eraser-options').classList.remove('active');
                document.getElementById('pencil-options').classList.remove('active');
                document.getElementById('eraser-tooltip').classList.remove('active');

                // Disattiva la modalità di disegno predefinita
                canvas.isDrawingMode = false;

                // Reimposta le impostazioni predefinite di selezione
                canvas.selection = true;

                // Imposta il cursore predefinito
                canvas.defaultCursor = 'default';

                // Rimuovi tutti gli event listener specifici degli strumenti
                canvas.off('mouse:down:before');
                canvas.off('mouse:move:before');

                // Configurazioni specifiche per ogni strumento
                if (tool === 'select') {
                    // Mantieni il comportamento esistente per lo strumento di selezione
                }
                else if (tool === 'eraser') {
                    // Se è selezionato lo strumento gomma, verifica che ci sia un livello attivo
                    const activeObject = canvas.getActiveObject();
                    if (!activeObject || activeObject.type !== 'image') {
                        showToast('warning', 'Seleziona prima immagine da modificare con la gomma');
                    }

                    document.getElementById('eraser-options').classList.add('active');
                    document.getElementById('eraser-tooltip').classList.add('active');
                    canvas.defaultCursor = 'crosshair';
                    canvas.selection = false;''

                    // Aggiungi i gestori per la gomma
                    canvas.on('mouse:down:before', handleEraserDown);
                    canvas.on('mouse:move:before', handleEraserMove);
                } else if (tool === 'pencil') {
                    document.getElementById('pencil-options').classList.add('active');
                    canvas.defaultCursor = 'crosshair';

                    // Usa la modalità di disegno libero integrata di Fabric.js
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush.color = pencilColor;
                    canvas.freeDrawingBrush.width = pencilSize;

                    // Aggiorna i valori della matita
                    updatePencilSize();
                    updatePencilColor();
                } else if (tool === 'remove-bg') {
                    canvas.defaultCursor = 'crosshair';

                    // Mostra il dialogo di rimozione sfondo se c'è un oggetto selezionato
                    if (canvas.getActiveObject()) {
                        showRemoveBgDialog();
                    } else {
                        showToast('warning', 'Seleziona prima immagine per rimuovere lo sfondo');
                    }
                } else {
                    // Ripristina la selezione normale per altri strumenti
                    canvas.selection = true;
                }
            }

            function selectAndShowLayer(layerId) {
                // Seleziona il layer nell'interfaccia
                selectLayer(layerId);

                // Trova e seleziona l'oggetto nel canvas
                const fabricObject = findObjectById(layerId);
                if (fabricObject) {
                    canvas.setActiveObject(fabricObject);

                    // Se l'oggetto non è visibile, mostralo temporaneamente
                    if (!fabricObject.visible) {
                        showToast('info', 'Il livello era nascosto. Lo mostro temporaneamente.');
                        const layer = findLayerById(layerId);
                        if (layer) {
                            layer.visible = true;
                            fabricObject.visible = true;

                            // Aggiorna UI
                            const layerElement = document.querySelector(`.layer-item[data-id="${layerId}"]`);
                            if (layerElement) {
                                const visibilityBtn = layerElement.querySelector('.layer-btn');
                                visibilityBtn.classList.add('visible');
                            }
                        }
                    }

                    canvas.requestRenderAll();
                }
            }
            // Funzione per gestire il click iniziale della gomma
            function handleEraserDown(opt) {
                if (currentTool !== 'eraser') return;

                const pointer = canvas.getPointer(opt.e);
                let targetFound = false;

                // Prima verifichiamo se c'è un oggetto selezionato
                const activeObject = canvas.getActiveObject();

                // Se c'è un oggetto attivo ed è un'immagine, verifichiamo se contiene il punto del click
                if (activeObject && activeObject.type === 'image' && activeObject.containsPoint(pointer)) {
                    targetFound = true;
                    isErasing = true;
                    activeImageForErasing = activeObject;
                } else {
                    // Se non c'è un oggetto attivo o se il click non è su quell'oggetto,
                    // possiamo opzionalmente cercare altri oggetti sotto il puntatore
                    // (questo è facoltativo - puoi rimuovere questa parte se vuoi che la gomma funzioni SOLO sull'oggetto selezionato)
                    showToast('warning', 'Seleziona prima un livello da modificare con la gomma!');
                    return;
                }

                // Disabilita completamente la selezione e il trascinamento
                canvas.selection = false;
                canvas.discardActiveObject();
                canvas.forEachObject(function(object) {
                    object._originalSelectable = object.selectable;
                    object.selectable = false;
                    object.evented = false;
                });

                // Memorizza posizione iniziale
                lastEraserX = pointer.x;
                lastEraserY = pointer.y;

                // Applica l'erasure al punto iniziale
                applyEraserAtPoint(activeImageForErasing, pointer.x, pointer.y, eraserSize);

                // Aggiorna subito il canvas
                canvas.requestRenderAll();

                // Blocca completamente l'evento
                if (targetFound) {
                    opt.e.stopPropagation();
                    opt.e.preventDefault();
                    return false;
                }
            }

// Funzione per gestire il movimento della gomma
            function handleEraserMove(opt) {
                if (currentTool !== 'eraser' || !isErasing || !activeImageForErasing) return;

                const pointer = canvas.getPointer(opt.e);

                // Evita movimenti identici o quasi (ottimizzazione)
                const dx = pointer.x - lastEraserX;
                const dy = pointer.y - lastEraserY;
                const distanceMoved = Math.sqrt(dx*dx + dy*dy);

                // Procedi solo se il movimento è significativo
                if (distanceMoved > 0.5) { // Threshold minimo per evitare calcoli inutili
                    // Applica l'effetto eraser con interpolazione migliorata
                    interpolateEraser(activeImageForErasing, lastEraserX, lastEraserY, pointer.x, pointer.y);

                    // Aggiorna l'ultima posizione
                    lastEraserX = pointer.x;
                    lastEraserY = pointer.y;

                    // Forza aggiornamento del canvas
                    canvas.requestRenderAll();
                }

                // Impedisci a FabricJS di selezionare durante il trascinamento
                opt.e.stopPropagation();
                opt.e.preventDefault();
            }


// Funzione per interpolare punti tra due posizioni del mouse
            function interpolateEraser(obj, x1, y1, x2, y2) {
                // Calcola la distanza tra i due punti
                const dx = x2 - x1;
                const dy = y2 - y1;
                const distance = Math.sqrt(dx*dx + dy*dy);

                // Anche con movimenti brevissimi, applica almeno un punto
                if (distance < 1) {
                    applyEraserAtPoint(obj, x2, y2, eraserSize);
                    return;
                }

                // Calcola quanti punti interpolare basandosi sulla distanza
                // Per movimenti veloci, aumentiamo la densità di punti
                const density = eraserSize > 25 ? 0.5 : (eraserSize > 15 ? 0.7 : 1.0);
                const minPoints = Math.max(Math.ceil(distance / (eraserSize * 0.3)), 3);
                const maxPoints = Math.min(Math.ceil(distance * density), 50); // Limite superiore per prestazioni
                const steps = Math.min(Math.max(minPoints, maxPoints), 50);

                // Traccia una linea con sovrappposizione per garantire continuità
                for (let i = 0; i <= steps; i++) {
                    const ratio = i / steps;
                    const x = x1 + dx * ratio;
                    const y = y1 + dy * ratio;

                    // Applica l'effetto gomma con leggera sovrapposizione
                    // Se la gomma è grande, varia leggermente la dimensione per un effetto più naturale
                    const sizeVariation = eraserSize > 20 ?
                        (0.95 + Math.random() * 0.1) : // Varia per gomme grandi
                        1.0; // Non variare per gomme piccole

                    applyEraserAtPoint(obj, x, y, eraserSize * sizeVariation);
                }
            }

// Funzione per applicare l'effetto di cancellazione a un punto specifico
            function applyEraserAtPoint(imageObj, x, y, customRadius) {
                if (!imageObj || imageObj.type !== 'image') return;

                // Usa il raggio personalizzato se fornito, altrimenti usa il valore standard
                const radius = customRadius || eraserSize;

                // Ottieni il contesto dell'immagine sorgente
                const imgElement = imageObj.getElement();

                // Crea una canvas temporanea per manipolare l'immagine
                if (!imageObj._eraserCanvas) {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = imgElement.width;
                    tempCanvas.height = imgElement.height;

                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(imgElement, 0, 0, tempCanvas.width, tempCanvas.height);

                    // Memorizza la canvas originale nell'oggetto
                    imageObj._eraserCanvas = tempCanvas;
                    imageObj._originalImageElement = imgElement;
                }

                // Ottieni il contesto della canvas temporanea
                const ctx = imageObj._eraserCanvas.getContext('2d');

                // Converti le coordinate del canvas alle coordinate dell'immagine
                const objectRel = fabricObjToImageCoords(imageObj, x, y);
                if (!objectRel) return;

                // Disegna un cerchio trasparente con bordo sfumato per una cancellazione più naturale
                ctx.globalCompositeOperation = 'destination-out';

                // Crea un gradiente radiale per bordi più morbidi
                const gradient = ctx.createRadialGradient(
                    objectRel.x, objectRel.y, 0,
                    objectRel.x, objectRel.y, radius / imageObj.scaleX
                );

                // Migliore distribuzione del gradiente per evitare "buchi"
                gradient.addColorStop(0, 'rgba(0,0,0,1)'); // Centro completamente opaco
                gradient.addColorStop(0.6, 'rgba(0,0,0,0.95)'); // Molto opaco verso la metà
                gradient.addColorStop(0.8, 'rgba(0,0,0,0.8)'); // Transizione più graduale
                gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Bordi completamente trasparenti

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(objectRel.x, objectRel.y, radius / imageObj.scaleX, 0, Math.PI * 2, false);
                ctx.fill();

                // Limita la frequenza di aggiornamento dell'immagine per migliorare le prestazioni
                // ma assicurati che l'aggiornamento avvenga abbastanza spesso da essere fluido
                if (!imageObj._eraserUpdatePending) {
                    imageObj._eraserUpdatePending = true;

                    // Usa un timeout breve invece di requestAnimationFrame per garantire un aggiornamento
                    // più regolare durante movimenti veloci
                    setTimeout(() => {
                        updateImageAfterErasing(imageObj);
                        imageObj._eraserUpdatePending = false;
                    }, 10); // 10ms è abbastanza breve da essere impercettibile ma riduce il carico
                }
            }

// Funzione per convertire le coordinate del canvas in coordinate dell'immagine
            function fabricObjToImageCoords(obj, canvasX, canvasY) {
                if (!obj) return null;

                // Tieni conto delle trasformazioni dell'oggetto (scala, rotazione, ecc.)
                const angle = obj.angle || 0;

                // Coordinate del centro dell'oggetto
                const objCenterX = obj.left;
                const objCenterY = obj.top;

                // Trasla le coordinate del canvas all'origine
                let x = canvasX - objCenterX;
                let y = canvasY - objCenterY;

                // Applica rotazione inversa se necessario
                if (angle !== 0) {
                    const rad = angle * Math.PI / 180;
                    const cos = Math.cos(-rad);
                    const sin = Math.sin(-rad);
                    const rx = x * cos - y * sin;
                    const ry = x * sin + y * cos;
                    x = rx;
                    y = ry;
                }

                // Applica scale e flip
                const scaleX = obj.scaleX || 1;
                const scaleY = obj.scaleY || 1;
                const flipX = obj.flipX ? -1 : 1;
                const flipY = obj.flipY ? -1 : 1;

                // Calcola le coordinate finali nell'immagine
                const imageX = (x * flipX / scaleX) + obj.width / 2;
                const imageY = (y * flipY / scaleY) + obj.height / 2;

                return { x: imageX, y: imageY };
            }

// Funzione per aggiornare l'immagine dopo la cancellazione
            // Funzione per aggiornare l'immagine dopo la cancellazione
            // Funzione per aggiornare l'immagine dopo la cancellazione
            function updateImageAfterErasing(imageObj) {
                if (!imageObj || !imageObj._eraserCanvas) return;

                // Aggiorna l'immagine con i pixel cancellati
                const eraserCanvas = imageObj._eraserCanvas;
                
                // Prova a creare un'immagine usando l'OffscreenCanvas o una soluzione alternativa
                try {
                    // Metodo alternativo: usa ImageData invece di toDataURL/toBlob
                    const ctx = eraserCanvas.getContext('2d');
                    const imageData = ctx.getImageData(0, 0, eraserCanvas.width, eraserCanvas.height);
                    
                    // Crea una nuova canvas per evitare problemi CORS
                    const newCanvas = document.createElement('canvas');
                    newCanvas.width = eraserCanvas.width;
                    newCanvas.height = eraserCanvas.height;
                    const newCtx = newCanvas.getContext('2d');
                    newCtx.putImageData(imageData, 0, 0);
                    
                    // Prova toDataURL sulla nuova canvas
                    const dataURL = newCanvas.toDataURL();
                    
                    const imgElement = new Image();
                    imgElement.crossOrigin = 'anonymous';
                    
                    imgElement.onload = function() {
                        if (imageObj && imageObj.setElement) {
                            imageObj.setElement(imgElement);
                            canvas.requestRenderAll();
                        }
                    };
                    
                    imgElement.onerror = function() {
                        console.warn('Failed to load updated image');
                    };
                    
                    imgElement.src = dataURL;
                    
                } catch (error) {
                    console.warn('Failed to update image after erasing:', error);
                    // Se tutto fallisce, almeno forza un re-render del canvas
                    canvas.requestRenderAll();
                }
            }
            // Show add image dialog
            function showAddImageDialog() {
                document.getElementById('add-image-dialog').classList.add('active');
                document.getElementById('image-upload').value = '';
                document.getElementById('layer-name').value = `Livello ${layers.length + 1}`;
            }
            
            // Hide add image dialog
            function hideAddImageDialog() {
                document.getElementById('add-image-dialog').classList.remove('active');
            }

            // Show plant gallery dialog
            function showPlantGalleryDialog() {
                document.getElementById('plant-gallery-dialog').classList.add('active');
                selectedPlant = null;
                loadPlants();
                updatePlantSelection();
            }

            // Hide plant gallery dialog
            function hidePlantGalleryDialog() {
                document.getElementById('plant-gallery-dialog').classList.remove('active');
                selectedPlant = null;
            }

            // Load plants into gallery
            function loadPlants() {
                const grid = document.getElementById('plant-gallery-grid');
                grid.innerHTML = '';

                const activeCategory = document.querySelector('.plant-tab.active').dataset.category;
                const searchTerm = document.getElementById('plant-search').value.toLowerCase();

                const filteredPlants = PLANTS_CONFIG.plants.filter(plant => {
                    const matchesCategory = activeCategory === 'all' || plant.category === activeCategory;
                    const matchesSearch = !searchTerm || 
                        plant.name.toLowerCase().includes(searchTerm) || 
                        plant.latinName.toLowerCase().includes(searchTerm);
                    return matchesCategory && matchesSearch;
                });

                if (filteredPlants.length === 0) {
                    grid.innerHTML = '<div class="plant-gallery-empty">Nessun elemento trovato</div>';
                    return;
                }

                filteredPlants.forEach(plant => {
                    const plantItem = createPlantItem(plant);
                    grid.appendChild(plantItem);
                });
            }

            // Create plant item element
            function createPlantItem(plant) {
                const item = document.createElement('div');
                item.className = 'plant-item';
                item.dataset.plantId = plant.id;

                item.innerHTML = `
                    <div class="plant-thumbnail">
                        <img src="${PLANTS_CONFIG.baseImagePath}${plant.image}" 
                             alt="${plant.name}" 
                             onerror="this.src='https://via.placeholder.com/120x100/e9ecef/495057?text=${encodeURIComponent(plant.name)}'">
                    </div>
                    <div class="plant-info">
                        <div class="plant-name">${plant.name}</div>
                        <div class="plant-latin">${plant.latinName}</div>
                    </div>
                    <div class="plant-link-icon" title="Vedi scheda">
                        <i class="fas fa-external-link-alt"></i>
                    </div>
                `;

                // Click on plant to select
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.plant-link-icon')) {
                        window.open(plant.link, '_blank');
                    } else {
                        selectPlant(plant);
                    }
                });

                return item;
            }

            // Select a plant
            function selectPlant(plant) {
                selectedPlant = plant;
                
                // Update UI
                document.querySelectorAll('.plant-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                const selectedItem = document.querySelector(`.plant-item[data-plant-id="${plant.id}"]`);
                if (selectedItem) {
                    selectedItem.classList.add('selected');
                }

                updatePlantSelection();
            }

            // Update plant selection UI
            function updatePlantSelection() {
                const confirmBtn = document.getElementById('plant-gallery-confirm');
                const selectedInfo = document.getElementById('selected-plant-info');
                const selectedName = document.getElementById('selected-plant-name');
                const detailsLink = document.getElementById('plant-details-link');

                if (selectedPlant) {
                    confirmBtn.disabled = false;
                    selectedInfo.style.display = 'block';
                    selectedName.textContent = selectedPlant.name;
                    detailsLink.href = selectedPlant.link;
                } else {
                    confirmBtn.disabled = true;
                    selectedInfo.style.display = 'none';
                    selectedName.textContent = '';
                }
            }

            // Filter plants based on search and category
            function filterPlants() {
                loadPlants();
            }
// Add plant from gallery
            // Add plant from gallery
            function addPlantFromGallery() {
                if (!selectedPlant) return;

                showLoading();

                const imagePath = PLANTS_CONFIG.baseImagePath + selectedPlant.image;

                // Usa fabric.Image.fromURL con crossOrigin per evitare problemi CORS
                fabric.Image.fromURL(imagePath, function(img) {
                    // Genera ID univoco
                    const uniqueId = generateUniqueId();
                    
                    // Scale image to fit within canvas
                    const maxWidth = canvas.getWidth() * 0.5;
                    const maxHeight = canvas.getHeight() * 0.5;

                    if (img.width > maxWidth || img.height > maxHeight) {
                        const scaleFactor = Math.min(maxWidth / img.width, maxHeight / img.height);
                        img.scale(scaleFactor);
                    }

                    // Imposta proprietà complete
                    img.set({
                        left: canvas.getWidth() / 2,
                        top: canvas.getHeight() / 2,
                        originX: 'center',
                        originY: 'center',
                        name: selectedPlant.name,
                        id: uniqueId,
                        plantData: selectedPlant,
                        selectable: true,
                        evented: true,
                        hasControls: true,
                        hasBorders: true,
                        hasRotatingPoint: true,
                        lockScalingFlip: false,
                        lockMovementX: false,
                        lockMovementY: false,
                        lockRotation: false,
                        lockScalingX: false,
                        lockScalingY: false,
                        cornerSize: 10,
                        cornerColor: '#4caf50',
                        borderColor: '#4caf50'
                    });

                    canvas.add(img);
                    canvas.setActiveObject(img);
                    canvas.requestRenderAll();

                    addLayer(img, selectedPlant.name);
                    addHistoryState();

                    hidePlantGalleryDialog();
                    hideLoading();
                    showToast('success', `${selectedPlant.name} aggiunta con successo!`);
                }, function(imgLoadError) {
                    hideLoading();
                    console.error('Errore nel caricamento dell\'immagine:', imgLoadError);
                    
                    // Prova un approccio alternativo creando un blob URL locale
                    fetch(imagePath)
                        .then(response => response.blob())
                        .then(blob => {
                            const blobUrl = URL.createObjectURL(blob);
                            
                            fabric.Image.fromURL(blobUrl, function(img) {
                                // Rilascia il blob URL dopo l'uso
                                URL.revokeObjectURL(blobUrl);
                                
                                const uniqueId = generateUniqueId();
                                
                                const maxWidth = canvas.getWidth() * 0.5;
                                const maxHeight = canvas.getHeight() * 0.5;

                                if (img.width > maxWidth || img.height > maxHeight) {
                                    const scaleFactor = Math.min(maxWidth / img.width, maxHeight / img.height);
                                    img.scale(scaleFactor);
                                }

                                img.set({
                                    left: canvas.getWidth() / 2,
                                    top: canvas.getHeight() / 2,
                                    originX: 'center',
                                    originY: 'center',
                                    name: selectedPlant.name,
                                    id: uniqueId,
                                    plantData: selectedPlant,
                                    selectable: true,
                                    evented: true,
                                    hasControls: true,
                                    hasBorders: true,
                                    hasRotatingPoint: true,
                                    lockScalingFlip: false,
                                    lockMovementX: false,
                                    lockMovementY: false,
                                    lockRotation: false,
                                    lockScalingX: false,
                                    lockScalingY: false,
                                    cornerSize: 10,
                                    cornerColor: '#4caf50',
                                    borderColor: '#4caf50'
                                });

                                canvas.add(img);
                                canvas.setActiveObject(img);
                                canvas.requestRenderAll();

                                addLayer(img, selectedPlant.name);
                                addHistoryState();

                                hidePlantGalleryDialog();
                                showToast('success', `${selectedPlant.name} aggiunta con successo!`);
                            });
                        })
                        .catch(error => {
                            console.error('Errore nel caricamento via blob:', error);
                            showToast('error', 'Errore nel caricamento dell\'immagine della pianta.');
                        });
                }, { crossOrigin: 'anonymous' }); // Importante: specifica crossOrigin qui
            }
            // Add image from dialog
function addImageFromDialog() {
    const fileInput = document.getElementById('image-upload');
    const layerName = document.getElementById('layer-name').value || `Livello ${layers.length + 1}`;
    
    if (fileInput.files && fileInput.files[0]) {
        showLoading();
        
        const reader = new FileReader();
        reader.onload = function(e) {
            fabric.Image.fromURL(e.target.result, function(img) {
                // Scale image to fit within canvas
                const maxWidth = canvas.getWidth() * 0.8;
                const maxHeight = canvas.getHeight() * 0.8;
                
                if (img.width > maxWidth || img.height > maxHeight) {
                    const scaleFactor = Math.min(maxWidth / img.width, maxHeight / img.height);
                    img.scale(scaleFactor);
                }
                
                // Center image
                img.set({
                    left: canvas.getWidth() / 2,
                    top: canvas.getHeight() / 2,
                    originX: 'center',
                    originY: 'center',
                    name: layerName,
                    // Assicurati che l'oggetto sia selezionabile e modificabile
                    selectable: true,
                    evented: true,
                    hasControls: true,
                    hasBorders: true,
                    lockScalingFlip: true
                });
                
                // Add image to canvas
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                
                // Create layer entry
                addLayer(img, layerName);
                
                // Add to history
                addHistoryState();
                
                hideAddImageDialog();
                hideLoading();
                showToast('success', 'Immagine aggiunta con successo!');
            });
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        showToast('error', 'Seleziona un\'immagine da caricare!');
    }
}
            
            // Delete selected layer
            function deleteSelectedLayer() {
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    // Remove from canvas
                    canvas.remove(activeObject);
                    
                    // Remove from layers
                    removeLayer(activeObject.id);
                    
                    // Add to history
                    addHistoryState();
                    
                    showToast('success', 'Livello eliminato con successo!');
                } else {
                    showToast('warning', 'Seleziona un livello da eliminare!');
                }
            }
            
            // Move layer up
            function moveLayerUp() {
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    // Move up in canvas
                    canvas.bringForward(activeObject);

                    // Reorder layers
                    updateLayerOrder();

                    // Add to history
                    addHistoryState();
                } else {
                    showToast('warning', 'Seleziona un livello da spostare!');
                }
            }

            // Move layer down
            function moveLayerDown() {
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    // Move down in canvas
                    canvas.sendBackwards(activeObject);

                    // Reorder layers
                    updateLayerOrder();

                    // Add to history
                    addHistoryState();
                } else {
                    showToast('warning', 'Seleziona un livello da spostare!');
                }
            }

            // Group selected layers
            function groupLayers() {
                const activeSelection = canvas.getActiveObject();
                if (activeSelection && activeSelection.type === 'activeSelection' && activeSelection.getObjects().length > 1) {
                    const group = activeSelection.toGroup();
                    group.name = 'Gruppo';
                    
                    // Update layers
                    updateLayersFromCanvas();
                    
                    // Add to history
                    addHistoryState();
                    
                    showToast('success', 'Livelli raggruppati con successo!');
                } else {
                    showToast('warning', 'Seleziona almeno 2 livelli da raggruppare!');
                }
            }
            
            // Ungroup selected group
            function ungroupLayers() {
                const activeObject = canvas.getActiveObject();
                if (activeObject && activeObject.type === 'group') {
                    const items = activeObject.getObjects();
                    activeObject.destroy();
                    canvas.remove(activeObject);
                    
                    canvas.add(...items);
                    canvas.discardActiveObject();
                    
                    // Update layers
                    updateLayersFromCanvas();
                    
                    // Add to history
                    addHistoryState();
                    
                    showToast('success', 'Gruppo separato con successo!');
                } else {
                    showToast('warning', 'Seleziona un gruppo da separare!');
                }
            }
            
            // Show remove background dialog
            function showRemoveBgDialog() {
                const activeObject = canvas.getActiveObject();
                if (activeObject && activeObject.type === 'image') {
                    document.getElementById('remove-bg-dialog').classList.add('active');
                    
                    // Initialize preview
                    initThresholdPreview(activeObject);
                } else {
                    showToast('warning', 'Seleziona un\'immagine per rimuovere lo sfondo!');
                }
            }
            
            // Hide remove background dialog
            function hideRemoveBgDialog() {
                document.getElementById('remove-bg-dialog').classList.remove('active');
            }
            
            // Initialize threshold preview
            function initThresholdPreview(imageObject) {
                const previewContainer = document.getElementById('filter-preview-container');
                previewContainer.innerHTML = '';
                
                // Create a canvas to display the preview
                const previewCanvas = document.createElement('canvas');
                previewContainer.appendChild(previewCanvas);
                
                // Set preview canvas size
                const maxPreviewWidth = previewContainer.clientWidth;
                const maxPreviewHeight = previewContainer.clientHeight;
                
                const imgElement = imageObject.getElement();
                const imgWidth = imgElement.width;
                const imgHeight = imgElement.height;
                
                // Scale to fit preview container
                const scaleFactor = Math.min(
                    maxPreviewWidth / imgWidth,
                    maxPreviewHeight / imgHeight
                );
                
                previewCanvas.width = imgWidth * scaleFactor;
                previewCanvas.height = imgHeight * scaleFactor;
                
                // Draw original image
                const ctx = previewCanvas.getContext('2d');
                ctx.drawImage(imgElement, 0, 0, previewCanvas.width, previewCanvas.height);
                
                // Initial update
                updateThresholdPreview();
            }
            
            // Update threshold preview
            function updateThresholdPreview() {
                const activeObject = canvas.getActiveObject();
                if (!activeObject || activeObject.type !== 'image') return;
                
                const previewContainer = document.getElementById('filter-preview-container');
                const previewCanvas = previewContainer.querySelector('canvas');
                if (!previewCanvas) return;
                
                const ctx = previewCanvas.getContext('2d');
                const imgElement = activeObject.getElement();
                
                // Clear canvas
                ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                
                // Draw original image
                ctx.drawImage(imgElement, 0, 0, previewCanvas.width, previewCanvas.height);
                
                // Get threshold value
                const threshold = parseInt(document.getElementById('threshold-slider').value);
                const tolerance = parseInt(document.getElementById('tolerance-slider').value);
                const mode = document.getElementById('bg-removal-mode').value;
                
                // Update labels
                document.getElementById('threshold-value').textContent = threshold;
                document.getElementById('tolerance-value').textContent = tolerance;
                
                // Apply threshold
                const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Calculate brightness (simple average)
                    const brightness = (r + g + b) / 3;
                    
                    // Apply threshold based on mode
                    if (mode === 'light' && brightness > threshold - tolerance && brightness < threshold + tolerance) {
                        data[i + 3] = 0; // Set alpha to 0 (transparent)
                    } else if (mode === 'dark' && brightness < threshold + tolerance && brightness > threshold - tolerance) {
                        data[i + 3] = 0; // Set alpha to 0 (transparent)
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
                
                // Replace the image
                fabric.Image.fromURL(tempCanvas.toDataURL(), function(img) {
                    // Copy properties from original object
                    img.set({
                        left: activeObject.left,
                        top: activeObject.top,
                        scaleX: activeObject.scaleX,
                        scaleY: activeObject.scaleY,
                        angle: activeObject.angle,
                        flipX: activeObject.flipX,
                        flipY: activeObject.flipY,
                        originX: activeObject.originX,
                        originY: activeObject.originY,
                        name: activeObject.name || 'Immagine con sfondo rimosso'
                    });
                    
                    // Replace in canvas
                    canvas.remove(activeObject);
                    canvas.add(img);
                    canvas.setActiveObject(img);
                    
                    // Update layers
                    updateLayersFromCanvas();
                    
                    // Add to history
                    addHistoryState();
                    
                    hideRemoveBgDialog();
                    hideLoading();
                    showToast('success', 'Sfondo rimosso con successo!');
                });
            }


            // Apply remove background to selected image
            function applyRemoveBackground() {
                const activeObject = canvas.getActiveObject();
                if (!activeObject || activeObject.type !== 'image') return;

                showLoading();

                // Get threshold settings
                const threshold = parseInt(document.getElementById('threshold-slider').value);
                const tolerance = parseInt(document.getElementById('tolerance-slider').value);
                const mode = document.getElementById('bg-removal-mode').value;

                // Create a temporary canvas for processing
                const tempCanvas = document.createElement('canvas');
                const imgElement = activeObject.getElement();
                tempCanvas.width = imgElement.width;
                tempCanvas.height = imgElement.height;

                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(imgElement, 0, 0, tempCanvas.width, tempCanvas.height);

                // Apply threshold
                const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Calculate brightness (simple average)
                    const brightness = (r + g + b) / 3;

                    // Apply threshold based on mode
                    if (mode === 'light') {
                        if (brightness >= threshold - tolerance) {
                            data[i + 3] = 0; // Set alpha to 0 (transparent)
                        }
                    } else if (mode === 'dark') {
                        if (brightness <= threshold + tolerance) {
                            data[i + 3] = 0; // Set alpha to 0 (transparent)
                        }
                    }
                }

                // Put the modified image data back
                ctx.putImageData(imageData, 0, 0);

                // Create new fabric image from modified canvas
                fabric.Image.fromURL(tempCanvas.toDataURL(), function(img) {
                    // Copy properties from original object
                    img.set({
                        left: activeObject.left,
                        top: activeObject.top,
                        scaleX: activeObject.scaleX,
                        scaleY: activeObject.scaleY,
                        angle: activeObject.angle,
                        flipX: activeObject.flipX,
                        flipY: activeObject.flipY,
                        originX: activeObject.originX,
                        originY: activeObject.originY,
                        name: activeObject.name || 'Immagine con sfondo rimosso',
                        id: activeObject.id // Preserve the ID
                    });

                    // Replace in canvas
                    canvas.remove(activeObject);
                    canvas.add(img);
                    canvas.setActiveObject(img);

                    // Update layers
                    updateLayersFromCanvas();

                    // Add to history
                    addHistoryState();

                    hideRemoveBgDialog();
                    hideLoading();
                    showToast('success', 'Sfondo rimosso con successo!');
                });
            }

            // Show export dialog
            function showExportDialog() {
                document.getElementById('export-dialog').classList.add('active');
                document.getElementById('export-filename').value = 'acquario-layout.png';
                updateQualityValue();
            }
            
            // Hide export dialog
            function hideExportDialog() {
                document.getElementById('export-dialog').classList.remove('active');
            }
            
            // Update quality value label
            function updateQualityValue() {
                const quality = document.getElementById('export-quality').value;
                document.getElementById('quality-value').textContent = `${Math.round(quality * 100)}%`;
            }
            
            // Export layout as image
            function exportLayout() {
                const filename = document.getElementById('export-filename').value || 'acquario-layout.png';
                const format = document.getElementById('export-format').value;
                const quality = parseFloat(document.getElementById('export-quality').value);
                
                // Generate data URL
                const dataURL = canvas.toDataURL({
                    format: format,
                    quality: quality
                });
                
                // Create download link
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                hideExportDialog();
                showToast('success', 'Layout esportato con successo!');
            }
            
            // Save project
            function saveProject() {
                try {
                    // Create project data
                    const projectData = {
                        version: '1.0',
                        canvasData: JSON.stringify(canvas),
                        layers: layers,
                        canvasWidth: canvas.getWidth(),
                        canvasHeight: canvas.getHeight(),
                        background: {
                            type: canvas.backgroundImage ? 'image' : 'color',
                            color: canvas.backgroundColor || '#ffffff',
                            imageData: canvas.backgroundImage ? canvas.backgroundImage.toDataURL() : null
                        }
                    };
                    
                    // Convert to JSON
                    const jsonData = JSON.stringify(projectData);
                    
                    // Create download link
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'acquario-layout.json';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showToast('success', 'Progetto salvato con successo!');
                } catch (error) {
                    console.error('Error saving project:', error);
                    showToast('error', 'Errore nel salvataggio del progetto!');
                }
            }

                        // Show background dialog
            function showBackgroundDialog() {
                document.getElementById('background-dialog').classList.add('active');

                // Initialize with current canvas background
                const currentBg = canvas.backgroundColor;
                if (currentBg) {
                    document.getElementById('background-color').value = currentBg;
                    document.getElementById('background-color-hex').value = currentBg;
                }

                // Show appropriate controls
                toggleBackgroundControls();
            }

            // Hide background dialog
            function hideBackgroundDialog() {
                document.getElementById('background-dialog').classList.remove('active');
            }

            // Toggle background controls based on selected type
            function toggleBackgroundControls() {
                const type = document.getElementById('background-type').value;

                if (type === 'color') {
                    document.getElementById('background-color-group').style.display = 'block';
                    document.getElementById('background-image-group').style.display = 'none';
                } else {
                    document.getElementById('background-color-group').style.display = 'none';
                    document.getElementById('background-image-group').style.display = 'block';
                }
            }

            // Update hex input when color input changes
            function updateHexInput(e) {
                document.getElementById('background-color-hex').value = e.target.value;
            }

            // Update color input when hex input changes
            function updateColorInput(e) {
                const hexValue = e.target.value;
                // Check if valid hex color
                if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
                    document.getElementById('background-color').value = hexValue;
                }
            }

            // Apply background from dialog
            function applyBackground() {
                const type = document.getElementById('background-type').value;

                if (type === 'color') {
                    // Apply color background
                    const color = document.getElementById('background-color').value;
                    canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));

                    // Add to history
                    addHistoryState();
                    showToast('success', 'Sfondo colorato applicato con successo!');
                    hideBackgroundDialog();
                } else {
                    // Apply image background
                    const fileInput = document.getElementById('background-upload');

                    if (fileInput.files && fileInput.files[0]) {
                        showLoading();

                        const reader = new FileReader();
                        reader.onload = function(e) {
                            fabric.Image.fromURL(e.target.result, function(img) {
                                // Scale image to fit canvas
                                const canvasWidth = canvas.getWidth();
                                const canvasHeight = canvas.getHeight();

                                // Scale to cover entire canvas
                                const scaleFactor = Math.max(
                                    canvasWidth / img.width,
                                    canvasHeight / img.height
                                );

                                img.scale(scaleFactor);

                                // Center background image
                                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                                    originX: 'center',
                                    originY: 'center',
                                    left: canvasWidth / 2,
                                    top: canvasHeight / 2
                                });

                                // Add to history
                                addHistoryState();
                                hideBackgroundDialog();
                                hideLoading();
                                showToast('success', 'Sfondo immagine applicato con successo!');
                            });
                        };
                        reader.readAsDataURL(fileInput.files[0]);
                    } else {
                        showToast('error', 'Seleziona un\'immagine di sfondo!');
                    }
                }
            }
            
            // Canvas mouse down handler
            function onCanvasMouseDown(e) {
                updatePositionInfo(e.pointer);

                if (currentTool === 'eraser') {
                    isErasing = true;
                } else if (currentTool === 'pencil') {
                    // Inizia il disegno con la matita
                    isPencilDrawing = true;

                    // Crea un nuovo percorso
                    currentPath = new fabric.Path(`M ${e.pointer.x} ${e.pointer.y}`, {
                        stroke: pencilColor,
                        strokeWidth: pencilSize,
                        fill: '',
                        strokeLineCap: 'round',
                        strokeLineJoin: 'round',
                        originX: 'center',
                        originY: 'center',
                        name: 'Disegno a matita'
                    });

                    canvas.add(currentPath);
                }
            }
            
            // Canvas mouse move handler
            function onCanvasMouseMove(e) {
                updatePositionInfo(e.pointer);

                if (isPencilDrawing && currentPath) {
                    // Aggiungi un punto al percorso
                    const path = currentPath.path;
                    path.push(['L', e.pointer.x, e.pointer.y]);
                    currentPath.set({ path: path });
                    canvas.requestRenderAll();
                }
            }
            
            // Canvas mouse up handler
            function onCanvasMouseUp() {
                if (isErasing && activeImageForErasing) {
                    isErasing = false;

                    // Ripristina la selezionabilità degli oggetti
                    canvas.forEachObject(function(object) {
                        if (object._originalSelectable !== undefined) {
                            object.selectable = object._originalSelectable;
                            object.evented = true;
                            delete object._originalSelectable;
                        }
                    });
                    canvas.selection = true;

                    // Aggiungi lo stato alla cronologia
                    if (activeImageForErasing._eraserCanvas) {
                        addHistoryState();
                        updateLayerThumbnail(activeImageForErasing);
                    }

                    activeImageForErasing = null;
                } else if (isPencilDrawing && currentPath) {
                    isPencilDrawing = false;

                    // Finalizza il percorso
                    canvas.setActiveObject(currentPath);

                    // Aggiungi il nuovo livello
                    addLayer(currentPath, 'Disegno a matita');

                    // Aggiungi lo stato alla cronologia
                    addHistoryState();

                    // Resetta il percorso corrente
                    currentPath = null;
                }
            }

            function updateLayerThumbnail(fabricObject, thumbnailElement) {
                if (!fabricObject) return;

                const layerId = getLayerIdFromObject(fabricObject);
                if (!thumbnailElement) {
                    const layerElement = document.querySelector(`.layer-item[data-id="${layerId}"]`);
                    if (layerElement) {
                        thumbnailElement = layerElement.querySelector('.layer-thumbnail');
                    }
                }

                if (!thumbnailElement) return;

                // Clear thumbnail
                thumbnailElement.innerHTML = '';

                if (fabricObject.type === 'image') {
                    // Create thumbnail for image
                    const img = document.createElement('img');
                    img.src = fabricObject.getSrc();
                    thumbnailElement.appendChild(img);
                } else if (fabricObject.type === 'group') {
                    // Create icon for group
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-object-group';
                    thumbnailElement.appendChild(icon);
                } else if (fabricObject.type === 'path') {
                    // Create icon for path/drawing
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-pencil-alt';
                    icon.style.color = fabricObject.stroke || '#000';
                    thumbnailElement.appendChild(icon);
                } else {
                    // Create icon for other types
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-shapes';
                    thumbnailElement.appendChild(icon);
                }
            }
            
            // Object modified handler
            function onObjectModified() {
                addHistoryState();
                updateLayerThumbnail(canvas.getActiveObject());
            }
            
            // Selection created/updated handler
            function onSelectionCreated(e) {
                const activeObject = e.selected[0];
                if (activeObject) {
                    selectLayer(getLayerIdFromObject(activeObject));
                }
            }
            
            // Selection cleared handler
            function onSelectionCleared() {
                selectLayer(null);
            }
            
            // Update position information
            function updatePositionInfo(pointer) {
                if (pointer) {
                    const x = Math.round(pointer.x);
                    const y = Math.round(pointer.y);
                    document.getElementById('position-info').textContent = `Posizione: ${x}, ${y} px`;
                }
            }
            
            // Update eraser size
            function updateEraserSize() {
    eraserSize = parseInt(document.getElementById('eraser-size-slider').value);
}
// Handle key down events
// Handle key down events

            // Update pencil size
            function updatePencilSize() {
                pencilSize = parseInt(document.getElementById('pencil-size-slider').value);
                // Aggiorna anche il pennello di disegno libero se è in modalità disegno
                if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
                    canvas.freeDrawingBrush.width = pencilSize;
                }
            }

// Update pencil color
            function updatePencilColor() {
                pencilColor = document.getElementById('pencil-color-picker').value;
                // Aggiorna anche il pennello di disegno libero se è in modalità disegno
                if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
                    canvas.freeDrawingBrush.color = pencilColor;
                }
            }
function handleKeyDown(e) {
    console.log("Key pressed:", e.key);

    // Delete key (Delete o Backspace)
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            deleteSelectedLayer();
            e.preventDefault(); // Previene l'azione predefinita del browser
        }
    }

    // Escape key - deselect everything
    if (e.key === 'Escape') {
        console.log("Escape pressed, deselecting objects");
        if (canvas.getActiveObject()) {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            selectLayer(null);
            showToast('info', 'Oggetto deselezionato');
            e.preventDefault(); // Previene l'azione predefinita del browser
        }
    }
}

// Handle context menu (right-click)
function handleContextMenu(e) {
    console.log("Right-click detected");

    // Prevent the default context menu
    e.preventDefault();
    e.stopPropagation();

    // Get the active object
    const activeObject = canvas.getActiveObject();

    // If there is an active object, deselect it (to "unstick" from cursor)
    if (activeObject) {
        console.log("Deselecting active object");
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        selectLayer(null);

        // Show a toast message
        showToast('info', 'Oggetto deselezionato');
    } else {
        // Se non c'è un oggetto attivo, mostra comunque il menu contestuale
        showCustomContextMenu(e.clientX, e.clientY);
    }

    return false;
}
// Optional: Custom context menu
// Mostra menu contestuale
function showCustomContextMenu(x, y) {
    console.log("Showing custom context menu at", x, y);

    // Rimuovi eventuali menu esistenti
    const existingMenu = document.querySelector('.custom-context-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }

    // Create a simple context menu
    const menu = document.createElement('div');
    menu.className = 'custom-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    menu.style.padding = '5px 0';
    menu.style.zIndex = '9999';

    // Add menu items
    const actions = [];

    // Get the active object
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
        actions.push(
            { text: 'Deseleziona', icon: 'fa-times', action: () => {
                canvas.discardActiveObject();
                canvas.requestRenderAll();
                selectLayer(null);
                showToast('info', 'Oggetto deselezionato');
            }},
            { text: 'Elimina', icon: 'fa-trash', action: () => {
                deleteSelectedLayer();
            }},
            { text: 'Porta avanti', icon: 'fa-arrow-up', action: () => {
                moveLayerUp();
            }},
            { text: 'Porta indietro', icon: 'fa-arrow-down', action: () => {
                moveLayerDown();
            }}
        );
    } else {
        actions.push(
            { text: 'Aggiungi immagine', icon: 'fa-image', action: () => {
                showAddImageDialog();
            }},
            { text: 'Imposta sfondo', icon: 'fa-fill-drip', action: () => {
                showBackgroundDialog();
            }}
        );
    }

    actions.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.padding = '8px 15px';
        menuItem.style.cursor = 'pointer';
        menuItem.style.display = 'flex';
        menuItem.style.alignItems = 'center';

        // Add icon
        const icon = document.createElement('i');
        icon.className = `fas ${item.icon}`;
        icon.style.marginRight = '8px';
        icon.style.width = '20px';
        menuItem.appendChild(icon);

        // Add text
        const text = document.createElement('span');
        text.textContent = item.text;
        menuItem.appendChild(text);

        // Hover effect
        menuItem.addEventListener('mouseover', () => {
            menuItem.style.backgroundColor = '#f5f5f5';
        });
        menuItem.addEventListener('mouseout', () => {
            menuItem.style.backgroundColor = 'transparent';
        });

        // Action
        menuItem.addEventListener('click', () => {
            item.action();
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
        });

        menu.appendChild(menuItem);
    });

    // Add to body
    document.body.appendChild(menu);

    // Close when clicking elsewhere
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
            document.removeEventListener('click', closeMenu);
        }
    };

    // Small delay to prevent immediate closing
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);

    return menu;
}
            
            // Add layer to the layers panel
            function addLayer(fabricObject, name = 'Nuovo Livello') {
                if (!fabricObject.id) {
                    fabricObject.id = generateUniqueId();
                }
                
                const layerItem = {
                    id: fabricObject.id,
                    name: name || fabricObject.name || 'Livello',
                    visible: true,
                    type: fabricObject.type || 'image',
                    object: fabricObject
                };
                
                // Add to layers array
                layers.unshift(layerItem);
                
                // Update UI
                renderLayers();
                
                // Select the new layer
                selectLayer(layerItem.id);
                
                return layerItem;
            }
            
            // Remove layer from layers panel
            function removeLayer(layerId) {
                const layerIndex = findLayerIndex(layerId);
                if (layerIndex !== -1) {
                    layers.splice(layerIndex, 1);
                    renderLayers();
                    
                    // Clear selection if the selected layer was deleted
                    if (selectedLayerId === layerId) {
                        selectedLayerId = null;
                    }
                }
            }
            
            // Update layer order based on canvas objects
            function updateLayerOrder() {
                // Get canvas objects in reverse order (top to bottom)
                const objects = canvas.getObjects().slice().reverse();

                // Temporary array to store new layer order
                const newLayers = [];

                // For each object, find matching layer and add to new array
                objects.forEach(obj => {
                    const layer = findLayerById(getLayerIdFromObject(obj));
                    if (layer) {
                        newLayers.push(layer);
                    }
                });

                // Replace layers array with new ordered array
                layers = newLayers;

                // Update UI
                renderLayers();
            }
            
            // Update layers from canvas (for operations like grouping/ungrouping)
            function updateLayersFromCanvas() {
                // Clear layers array
                layers = [];

                // Get canvas objects in reverse order (top to bottom)
                const objects = canvas.getObjects().slice().reverse();

                // Add each object as a layer
                objects.forEach(obj => {
                    if (!obj.id) {
                        obj.id = generateUniqueId();
                    }

                    addLayer(obj, obj.name || getDefaultNameForType(obj.type));
                });

                // Update UI
                renderLayers();
            }
            
            // Get default name for object type
            function getDefaultNameForType(type) {
                switch (type) {
                    case 'image': return 'Immagine';
                    case 'group': return 'Gruppo';
                    default: return 'Livello';
                }
            }
            
            // Render all layers in the sidebar
            function renderLayers() {
                const container = document.getElementById('layers-container');
                container.innerHTML = '';

                layers.forEach(layer => {
                    const layerElement = createLayerElement(layer);
                    container.appendChild(layerElement);
                });
            }
            
            // Create HTML element for a layer
            function createLayerElement(layer) {
                const layerElement = document.createElement('div');
                layerElement.className = `layer-item ${layer.id === selectedLayerId ? 'active' : ''} ${layer.type === 'group' ? 'group' : ''}`;
                layerElement.dataset.id = layer.id;
                
                // Create thumbnail
                const thumbnail = document.createElement('div');
                thumbnail.className = 'layer-thumbnail';
                
                // Create layer info
                const info = document.createElement('div');
                info.className = 'layer-info';
                
                const name = document.createElement('div');
                name.className = 'layer-name';
                name.textContent = layer.name;
                
                const type = document.createElement('div');
                type.className = 'layer-type';
                type.textContent = capitalizeFirstLetter(layer.type);
                
                info.appendChild(name);
                info.appendChild(type);
                
                // Create controls
                const controls = document.createElement('div');
                controls.className = 'layer-controls';
                
                const visibilityBtn = document.createElement('button');
                visibilityBtn.className = `layer-btn ${layer.visible ? 'visible' : ''}`;
                visibilityBtn.innerHTML = '<i class="fas fa-eye"></i><i class="fas fa-eye-slash"></i>';
                visibilityBtn.title = 'Mostra/Nascondi';
                
                controls.appendChild(visibilityBtn);
                
                // Add elements to layer item
                layerElement.appendChild(thumbnail);
                layerElement.appendChild(info);
                layerElement.appendChild(controls);
                
                // Generate thumbnail
                updateLayerThumbnail(layer.object, thumbnail);
                
                // Add event listeners
                layerElement.addEventListener('click', () => {
                    selectLayer(layer.id);
                    const fabricObject = findObjectById(layer.id);
                    if (fabricObject) {
                        canvas.setActiveObject(fabricObject);
                        canvas.requestRenderAll();
                    }
                });
                
                visibilityBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                });
                
                return layerElement;
            }
            
            // Update layer thumbnail
            function updateLayerThumbnail(fabricObject, thumbnailElement) {
                if (!fabricObject) return;
                
                const layerId = getLayerIdFromObject(fabricObject);
                if (!thumbnailElement) {
                    const layerElement = document.querySelector(`.layer-item[data-id="${layerId}"]`);
                    if (layerElement) {
                        thumbnailElement = layerElement.querySelector('.layer-thumbnail');
                    }
                }
                
                if (!thumbnailElement) return;
                
                // Clear thumbnail
                thumbnailElement.innerHTML = '';
                
                if (fabricObject.type === 'image') {
                    // Create thumbnail for image
                    const img = document.createElement('img');
                    img.src = fabricObject.getSrc();
                    thumbnailElement.appendChild(img);
                } else if (fabricObject.type === 'group') {
                    // Create icon for group
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-object-group';
                    thumbnailElement.appendChild(icon);
                } else {
                    // Create icon for other types
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-shapes';
                    thumbnailElement.appendChild(icon);
                }
            }
            
            // Select layer and update UI
            function selectLayer(layerId) {
                selectedLayerId = layerId;
                
                // Update UI
                document.querySelectorAll('.layer-item').forEach(item => {
                    if (item.dataset.id === layerId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
            
            // Toggle layer visibility
            function toggleLayerVisibility(layerId) {
                const layer = findLayerById(layerId);
                if (layer) {
                    layer.visible = !layer.visible;
                    
                    // Update Fabric.js object
                    const fabricObject = findObjectById(layerId);
                    if (fabricObject) {
                        fabricObject.visible = layer.visible;
                        canvas.requestRenderAll();
                    }
                    
                    // Update UI
                    const layerElement = document.querySelector(`.layer-item[data-id="${layerId}"]`);
                    if (layerElement) {
                        const visibilityBtn = layerElement.querySelector('.layer-btn');
                        if (layer.visible) {
                            visibilityBtn.classList.add('visible');
                        } else {
                            visibilityBtn.classList.remove('visible');
                        }
                    }
                    
                    // Add to history
                    addHistoryState();
                }
            }
            
            // Find layer by ID
            function findLayerById(id) {
                return layers.find(layer => layer.id === id);
            }
            
            // Find layer index by ID
            function findLayerIndex(id) {
                return layers.findIndex(layer => layer.id === id);
            }
            
            // Find Fabric.js object by layer ID
            function findObjectById(id) {
                return canvas.getObjects().find(obj => obj.id === id);
            }
            
            // Get layer ID from Fabric.js object
            function getLayerIdFromObject(obj) {
                return obj.id;
            }
            
            // Generate unique ID
            function generateUniqueId() {
                return '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Capitalize first letter
            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            
            // Add current state to history
            function addHistoryState() {
                // If we're not at the end of history, truncate
                if (historyIndex < history.length - 1) {
                    history = history.slice(0, historyIndex + 1);
                }
                
                // Add current state
                const state = JSON.stringify(canvas);
                history.push(state);
                
                // Limit history size
                if (history.length > maxHistoryStates) {
                    history.shift();
                }
                
                historyIndex = history.length - 1;
                
                // Update UI
                updateHistoryButtons();
            }
            
            // Undo last action
            function undo() {
                if (historyIndex > 0) {
                    historyIndex--;
                    loadHistoryState(historyIndex);
                    showToast('info', 'Azione annullata');
                } else {
                    showToast('warning', 'Nessuna azione da annullare');
                }
            }
            
            // Redo last undone action
            function redo() {
                if (historyIndex < history.length - 1) {
                    historyIndex++;
                    loadHistoryState(historyIndex);
                    showToast('info', 'Azione ripristinata');
                } else {
                    showToast('warning', 'Nessuna azione da ripristinare');
                }
            }
            
            // Load history state
            function loadHistoryState(index) {
                if (index >= 0 && index < history.length) {
                    // Load canvas state
                    canvas.loadFromJSON(history[index], () => {
                        canvas.renderAll();
                        
                        // Rebuild layers from canvas
                        updateLayersFromCanvas();
                        
                        // Update UI
                        updateHistoryButtons();
                    });
                }
            }
            
            // Update history buttons state
            function updateHistoryButtons() {
                const undoBtn = document.getElementById('undo-btn');
                const redoBtn = document.getElementById('redo-btn');
                
                // Update undo button
                if (historyIndex > 0) {
                    undoBtn.classList.remove('disabled');
                } else {
                    undoBtn.classList.add('disabled');
                }
                
                // Update redo button
                if (historyIndex < history.length - 1) {
                    redoBtn.classList.remove('disabled');
                } else {
                    redoBtn.classList.add('disabled');
                }
            }
            
            // Show loading overlay
            function showLoading() {
                document.getElementById('loading-overlay').classList.add('active');
            }
            
            // Hide loading overlay
            function hideLoading() {
                document.getElementById('loading-overlay').classList.remove('active');
            }
            
            // Show toast message
            function showToast(type, message) {
                const toastContainer = document.getElementById('toast-container');
                
                // Create toast element
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                
                // Add message
                const messageSpan = document.createElement('span');
                messageSpan.textContent = message;
                toast.appendChild(messageSpan);
                
                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'toast-close';
                closeBtn.innerHTML = '&times;';
                closeBtn.addEventListener('click', () => {
                    toast.remove();
                });
                toast.appendChild(closeBtn);
                
                // Add to container
                toastContainer.appendChild(toast);
                
                // Auto remove after 3 seconds
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 3000);
            }
            
            // Return public API
            return {
                init: init
            };
        })();

        // Initialize app when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            AcquarioLayoutDesigner.init();
        });


    