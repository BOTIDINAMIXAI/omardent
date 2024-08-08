document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        insumosList: document.getElementById('insumos-list'),
        totalElement: document.getElementById('total'),
        chatArea: document.getElementById('chat-area'),
        responseArea: document.getElementById('response-area'),
        agregarInsumoBtn: document.getElementById('agregar-insumo'),
        generarPdfBtn: document.getElementById('generar-pdf'),
        sendQuestionBtn: document.getElementById('send-question'),
        agregarRespuestaInsumoBtn: document.getElementById('agregar-respuesta-insumo'),
        rolSelect: document.getElementById('rol-select'),
        audioElement: document.getElementById('audio-element'),
        uploadForm: document.getElementById('upload-form'),
        fileInput: document.getElementById('file-input')
    };

    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Elemento no encontrado en el DOM: ${key}`);
            return;
        }
    }

    let totalInsumos = 0;
    const insumosData = [];

    function actualizarTotal() {
        elements.totalElement.textContent = `Total de Insumos: ${totalInsumos}`;
    }

    function agregarInsumo(insumo) {
        insumosData.push(insumo);
        const { nombre, cantidad, fechaPedido, fechaNecesidad, necesidadUrgente, doctor, marca } = insumo;
        const listItem = document.createElement('li');
        listItem.textContent = `${cantidad} x ${nombre} - Pedido: ${fechaPedido} - Necesidad: ${fechaNecesidad} - Urgente: ${necesidadUrgente ? 'Sí' : 'No'} - Doctor: ${doctor} - Marca: ${marca}`;
        elements.insumosList.appendChild(listItem);

        totalInsumos += 1;
        actualizarTotal();
    }

    elements.agregarInsumoBtn.addEventListener('click', () => {
        const nombre = document.getElementById('insumo_nombre').value;
        const cantidad = parseInt(document.getElementById('insumo_cantidad').value);
        const fechaPedido = document.getElementById('fecha_pedido').value;
        const fechaNecesidad = document.getElementById('fecha_necesidad').value;
        const necesidadUrgente = document.getElementById('necesidad_urgente').checked;
        const doctor = document.getElementById('doctor').value;
        const marca = document.getElementById('marca').value;

        if (nombre && cantidad >= 0 && fechaPedido && fechaNecesidad && doctor && marca) {
            const insumo = {
                nombre, cantidad, fechaPedido, fechaNecesidad, necesidadUrgente, doctor, marca
            };
            agregarInsumo(insumo);
            alert(`Insumo '${nombre}' agregado con éxito.`);
        } else {
            alert("Por favor, complete todos los campos.");
        }
    });

    elements.generarPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const img = new Image();
        img.src = 'imagenes/logo.jpg'; // Ruta de la imagen

        img.onload = () => {
            // Agregar imagen centrada en la parte superior
            const imgWidth = 50; // Ancho de la imagen
            const imgHeight = 50; // Alto de la imagen
            const x = (doc.internal.pageSize.getWidth() - imgWidth) / 2; // Posición X centrada
            doc.addImage(img, 'JPEG', x, 10, imgWidth, imgHeight);

            // Agregar título
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Registro de Insumos', doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });

            // Agregar tabla de insumos
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');

            let startY = 90;
            const tableColumn = ["Cantidad", "Nombre del Insumo", "Fecha de Pedido", "Fecha de Necesidad", "Urgente", "Doctor", "Marca"];
            const tableRows = [];

            insumosData.forEach(insumo => {
                const insumoData = [
                    insumo.cantidad,
                    insumo.nombre,
                    insumo.fechaPedido,
                    insumo.fechaNecesidad,
                    insumo.necesidadUrgente ? 'Sí' : 'No',
                    insumo.doctor,
                    insumo.marca
                ];
                tableRows.push(insumoData);
            });

            doc.autoTable(tableColumn, tableRows, { startY: startY });

            // Guardar PDF
            doc.save('registro_insumos.pdf');
        };
    });

    elements.sendQuestionBtn.addEventListener('click', async () => {
        const question = elements.chatArea.value;
        if (!question) return;

        const rol = elements.rolSelect.value;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: question, rol })
            });
            const data = await response.json();
            elements.responseArea.innerText = data.reply;
            if (data.audioContent) {
                elements.audioElement.src = `data:audio/mp3;base64,${data.audioContent}`;
                elements.audioElement.style.display = 'block';
                elements.audioElement.play();
            }
        } catch (error) {
            console.error('Error fetching chat response:', error);
            alert('Error al obtener la respuesta del chat.');
        }
    });

    elements.agregarRespuestaInsumoBtn.addEventListener('click', () => {
        const respuesta = elements.responseArea.innerText;
        if (respuesta) {
            procesarRespuestaDelAsistente(respuesta);
        } else {
            alert('No hay respuesta del asistente para procesar.');
        }
    });

    async function enviarPreguntaAlAsistente(pregunta, rol) {
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: pregunta, rol })
            });
            const data = await response.json();
            elements.responseArea.innerText = data.reply;
            if (data.audioContent) {
                elements.audioElement.src = `data:audio/mp3;base64,${data.audioContent}`;
                elements.audioElement.style.display = 'block';
                elements.audioElement.play();
            }
        } catch (error) {
            console.error('Error fetching chat response:', error);
            alert('Error al obtener la respuesta del chat.');
        }
    }

    function procesarRespuestaDelAsistente(respuesta) {
        const regex = /Necesitamos (\d+) unidades de (.+) para el (.+), marca (.+), con fecha de pedido (.+) y fecha de necesidad (.+)\./;
        const match = respuesta.match(regex);

        if (match) {
            const cantidad = parseInt(match[1]);
            const nombre = match[2];
            const doctor = match[3];
            const marca = match[4];
            const fechaPedido = match[5];
            const fechaNecesidad = match[6];

            const insumo = {
                nombre, cantidad, fechaPedido, fechaNecesidad, necesidadUrgente: false, doctor, marca
            };
            agregarInsumo(insumo);
            alert(`Insumo '${nombre}' agregado automáticamente desde la respuesta del chat.`);
        } else {
            alert('No se pudo procesar la respuesta del asistente.');
        }
    }

    elements.uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('file', elements.fileInput.files[0]);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Archivo subido exitosamente y contexto actualizado');
            } else {
                const errorText = await response.text();
                alert('Error al subir el archivo: ' + errorText);
            }
        } catch (error) {
            console.error('Error al subir el archivo:', error);
            alert('Error al subir el archivo.');
        }
    });
});
