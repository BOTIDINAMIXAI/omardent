document.addEventListener('DOMContentLoaded', () => {
    const textArea = document.getElementById('textArea');
    const responseArea = document.getElementById('responseArea');
    const listaServicios = document.getElementById('lista-servicios');
    const agregarServicioBtn = document.getElementById('agregar-servicio');
    const copiarServiciosBtn = document.getElementById('copiar-servicios');
    const startButton = document.getElementById('start-button');
    const generarPDFBtn = document.getElementById('generar-pdf');
    const rolAsistente = document.getElementById('rol-asistente');
    const serviciosSeleccionados = [];

    if (!textArea || !responseArea || !listaServicios || !agregarServicioBtn || !copiarServiciosBtn || !startButton || !generarPDFBtn || !rolAsistente) {
        console.error("Uno o más elementos no se encontraron en el DOM");
        return;
    }

    const generarRespuestaGPT = async (instrucciones, rol) => {
        try {
            const response = await axios.post(
                '/chat', // Asegúrate de que este endpoint esté configurado en tu servidor
                {
                    input: `${rol === 'presupuesto' ? 'Generar presupuesto: ' : ''}${rol === 'calculos' ? 'Realizar cálculos: ' : ''}${instrucciones}`
                }
            );
            return response.data.reply.trim();
        } catch (error) {
            console.error('Error generando la respuesta con GPT-4:', error);
            throw error;
        }
    };

    const generarPDFPresupuesto = (datosPaciente, presupuesto, servicios) => {
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
            doc.text('PRESUPUESTO ODONTOLÓGICO', doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });

            // Agregar datos del paciente
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Nombre: ${datosPaciente.nombre}`, 10, 90);
            doc.text(`Doctor: ${datosPaciente.doctor}`, 10, 100);
            doc.text(`Fecha: ${datosPaciente.fecha}`, 10, 110);

            // Agregar servicios seleccionados
            doc.text('Servicios Seleccionados:', 10, 120);
            servicios.forEach((servicio, index) => {
                doc.text(`${index + 1}. ${servicio}`, 10, 130 + index * 10);
            });

            // Agregar presupuesto
            doc.setFontSize(10);
            doc.text('Presupuesto:', 10, 140 + servicios.length * 10);
            doc.text(presupuesto, 10, 150 + servicios.length * 10);

            // Guardar PDF
            doc.save('presupuesto_odontologico.pdf');
        };
    };

    agregarServicioBtn.addEventListener('click', () => {
        const servicio = document.getElementById('servicio').value;
        if (servicio) {
            serviciosSeleccionados.push(servicio);
            const listItem = document.createElement('li');
            listItem.textContent = servicio;
            listaServicios.appendChild(listItem);
        }
    });

    copiarServiciosBtn.addEventListener('click', () => {
        const serviciosText = serviciosSeleccionados.join(', ');
        textArea.value = serviciosText;
    });

    startButton.addEventListener('click', async () => {
        const instrucciones = textArea.value;
        const rol = rolAsistente.value;
        if (!instrucciones) {
            alert('Por favor, ingresa las instrucciones para generar el presupuesto.');
            return;
        }

        try {
            const presupuesto = await generarRespuestaGPT(instrucciones, rol);
            responseArea.innerText = presupuesto;
        } catch (error) {
            console.error('Error generando el presupuesto:', error);
            alert('Error al generar el presupuesto.');
        }
    });

    generarPDFBtn.addEventListener('click', async () => {
        const nombre = document.getElementById('nombre').value;
        const doctor = document.getElementById('doctor').value;
        const fecha = document.getElementById('fecha').value;

        if (!nombre || !doctor || !fecha || serviciosSeleccionados.length === 0) {
            alert('Por favor, completa todos los campos del paciente y selecciona al menos un servicio.');
            return;
        }

        const datosPaciente = { nombre, doctor, fecha };

        const presupuesto = responseArea.innerText;
        if (!presupuesto) {
            alert('Por favor, genera el presupuesto con el asistente de chat antes de crear el PDF.');
            return;
        }

        generarPDFPresupuesto(datosPaciente, presupuesto, serviciosSeleccionados);
    });
});
