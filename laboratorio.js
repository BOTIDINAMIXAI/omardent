document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        trabajosList: document.getElementById('trabajos-list'),
        totalElement: document.getElementById('total'),
        chatArea: document.getElementById('chat-area'),
        responseArea: document.getElementById('response-area'),
        registrarTrabajoBtn: document.getElementById('registrar-trabajo'),
        generarPdfBtn: document.getElementById('generar-pdf'),
        sendQuestionBtn: document.getElementById('send-question'),
        agregarRespuestaTrabajoBtn: document.getElementById('agregar-respuesta-trabajo'),
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

    let totalTrabajos = 0;
    const trabajosData = [];

    function actualizarTotal() {
        elements.totalElement.textContent = `Total de Trabajos: ${totalTrabajos}`;
    }

    function agregarTrabajo(trabajo) {
        trabajosData.push(trabajo);
        const { tipoTrabajo, doctor, fechaEntrega, fechaEnvio, laboratorio, nombrePaciente, observaciones, numeroOrden, cantidad } = trabajo;
        const listItem = document.createElement('li');
        listItem.textContent = `${cantidad} x ${tipoTrabajo} - Doctor: ${doctor} - Entrega: ${fechaEntrega} - Envío: ${fechaEnvio} - Lab: ${laboratorio} - Paciente: ${nombrePaciente} - Observaciones: ${observaciones} - Orden: ${numeroOrden}`;
        elements.trabajosList.appendChild(listItem);

        totalTrabajos += 1;
        actualizarTotal();
    }

    elements.registrarTrabajoBtn.addEventListener('click', () => {
        const tipoTrabajo = document.getElementById('tipo_trabajo').value;
        const doctor = document.getElementById('doctor').value;
        const fechaEntrega = document.getElementById('fecha_entrega').value;
        const fechaEnvio = document.getElementById('fecha_envio').value;
        const laboratorio = document.getElementById('laboratorio').value;
        const nombrePaciente = document.getElementById('nombre_paciente').value;
        const observaciones = document.getElementById('observaciones').value;
        const numeroOrden = document.getElementById('numero_orden').value;
        const cantidad = parseInt(document.getElementById('cantidad').value);

        if (tipoTrabajo && doctor && fechaEntrega && fechaEnvio && laboratorio && nombrePaciente && numeroOrden && cantidad > 0) {
            const trabajo = {
                tipoTrabajo,
                doctor,
                fechaEntrega,
                fechaEnvio,
                laboratorio,
                nombrePaciente,
                observaciones,
                numeroOrden,
                cantidad
            };
            agregarTrabajo(trabajo);
            alert("Trabajo registrado con éxito.");
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
            doc.text('Registro de Trabajos de Laboratorio', doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });

            // Agregar tabla de trabajos
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');

            let startY = 90;
            const tableColumn = ["Cantidad", "Tipo de Trabajo", "Doctor", "Fecha de Entrega", "Fecha de Envío", "Laboratorio", "Nombre del Paciente", "Observaciones", "Número de Orden"];
            const tableRows = [];

            trabajosData.forEach(trabajo => {
                const trabajoData = [
                    trabajo.cantidad,
                    trabajo.tipoTrabajo,
                    trabajo.doctor,
                    trabajo.fechaEntrega,
                    trabajo.fechaEnvio,
                    trabajo.laboratorio,
                    trabajo.nombrePaciente,
                    trabajo.observaciones,
                    trabajo.numeroOrden
                ];
                tableRows.push(trabajoData);
            });

            doc.autoTable(tableColumn, tableRows, { startY: startY });

            // Guardar PDF
            doc.save('registro_trabajos_laboratorio.pdf');
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

    elements.agregarRespuestaTrabajoBtn.addEventListener('click', () => {
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

            const trabajo = {
                tipoTrabajo: nombre,
                doctor,
                fechaEntrega: fechaNecesidad,
                fechaEnvio: fechaPedido,
                laboratorio: marca,
                nombrePaciente: 'N/A',
                observaciones: '',
                numeroOrden: 'N/A',
                cantidad
            };
            agregarTrabajo(trabajo);
            alert(`Trabajo '${nombre}' agregado automáticamente desde la respuesta del chat.`);
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
