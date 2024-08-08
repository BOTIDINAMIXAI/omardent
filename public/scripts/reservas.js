document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        reservationButton: document.getElementById('submit-reservation'),
        checkAvailabilityButton: document.getElementById('verificar-disponibilidad'),
        reservationsTableBody: document.querySelector('#reservations-table tbody'),
        uploadForm: document.getElementById('upload-form'),
        uploadUrlButton: document.getElementById('upload-url-button'),
        generatePdfButton: document.getElementById('generate-pdf'),
        viewReservationsButton: document.getElementById('view-reservations'),
        clearReservationsButton: document.getElementById('clear-reservations'),
        exportCsvButton: document.getElementById('export-csv'),
        rolSelect: document.getElementById('rol-select'),
        startButton: document.getElementById('start-button'),
        textArea: document.getElementById('textArea'),
        responseArea: document.getElementById('responseArea'),
        fileInput: document.getElementById('file-input'),
        urlInput: document.getElementById('url-input')
    };

    if (!elements.reservationButton || !elements.checkAvailabilityButton || !elements.reservationsTableBody || !elements.uploadForm ||
        !elements.generatePdfButton || !elements.viewReservationsButton || !elements.clearReservationsButton ||
        !elements.exportCsvButton || !elements.uploadUrlButton || !elements.rolSelect || 
        !elements.startButton || !elements.textArea || !elements.responseArea || 
        !elements.fileInput || !elements.urlInput) {
        console.error("Uno o más elementos no se encontraron en el DOM");
        return;
    }

    elements.reservationButton.addEventListener('click', handleReservation);
    elements.checkAvailabilityButton.addEventListener('click', checkAvailability);
    elements.uploadForm.addEventListener('submit', handleFileUpload);
    elements.uploadUrlButton.addEventListener('click', handleUrlUpload);
    elements.generatePdfButton.addEventListener('click', generatePDF);
    elements.viewReservationsButton.addEventListener('click', viewReservations);
    elements.clearReservationsButton.addEventListener('click', clearReservations);
    elements.exportCsvButton.addEventListener('click', exportToCSV);
    elements.startButton.addEventListener('click', sendQuestion);

    async function handleReservation() {
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const reason = document.getElementById('reason').value;

        if (!name || !phone || !reason) {
            alert('Por favor, complete todos los campos.');
            return;
        }

        const reservation = { name, phone, reason };

        // Añadir la reserva a la tabla
        addReservationToTable(reservation);

        // Limpiar los campos del formulario
        document.getElementById('name').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('reason').value = '';
    }

    function addReservationToTable(reservation) {
        const row = elements.reservationsTableBody.insertRow();
        row.insertCell(0).innerText = reservation.name;
        row.insertCell(1).innerText = reservation.phone;
        row.insertCell(2).innerText = reservation.reason;
    }

    async function handleFileUpload(event) {
        event.preventDefault();
        const formData = new FormData();
        formData.append('file', elements.fileInput.files[0]);

        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            const result = await response.text();
            alert(result);
        } catch (error) {
            console.error('Error al subir el archivo:', error);
            alert('Error al subir el archivo.');
        }
    }

    async function handleUrlUpload() {
        const url = elements.urlInput.value;
        if (!url) {
            alert('Por favor, ingrese una URL.');
            return;
        }

        try {
            const response = await fetch('/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (response.ok) {
                const result = await response.text();
                alert(result);
            } else {
                const errorText = await response.text();
                console.error('Error al cargar la URL:', errorText);
                alert('Error al cargar la URL: ' + errorText);
            }
        } catch (error) {
            console.error('Error al manejar la carga de la URL:', error);
            alert('Error al manejar la carga de la URL.');
        }
    }

    async function sendQuestion() {
        const question = elements.textArea.value;
        const rol = elements.rolSelect.value;

        if (!question) {
            alert('Por favor, ingrese su pregunta.');
            return;
        }

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: question, rol })
            });

            if (response.ok) {
                const data = await response.json();
                elements.responseArea.innerText = data.reply;

                // Reproducción de la respuesta en voz
                const audioContent = data.audioContent;
                const audio = new Audio("data:audio/mp3;base64," + audioContent);
                audio.play();
            } else {
                const errorText = await response.text();
                console.error('Error al enviar la pregunta:', errorText);
                alert('Error al enviar la pregunta: ' + errorText);
            }
        } catch (error) {
            console.error('Error al manejar el envío de la pregunta:', error);
            alert('Error al manejar el envío de la pregunta.');
        }
    }

    function generatePDF() {
        // Lógica para generar PDF con las reservas
        console.log('Generando PDF con las reservas...');
    }

    function viewReservations() {
        // Lógica para ver las reservas
        console.log('Mostrando reservas...');
    }

    function clearReservations() {
        elements.reservationsTableBody.innerHTML = '';
        console.log('Reservas borradas.');
    }

    function exportToCSV() {
        let csvContent = "data:text/csv;charset=utf-8,";
        const rows = elements.reservationsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowContent = Array.from(cells).map(cell => cell.innerText).join(',');
            csvContent += rowContent + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'reservas.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Exportando reservas a CSV...');
    }

    async function checkAvailability() {
        const date = document.getElementById('fecha').value;

        if (!date) {
            alert('Por favor, seleccione una fecha.');
            return;
        }

        try {
            const response = await fetch('/horarios-disponibles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fecha: date })
            });

            if (response.ok) {
                const horarios = await response.json();
                alert('Horarios disponibles: ' + horarios.join(', '));
            } else {
                const errorText = await response.text();
                console.error('Error al verificar disponibilidad:', errorText);
                alert('Error al verificar disponibilidad: ' + errorText);
            }
        } catch (error) {
            console.error('Error al manejar la verificación de disponibilidad:', error);
            alert('Error al manejar la verificación de disponibilidad.');
        }
    }
});
