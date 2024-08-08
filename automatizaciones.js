document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        pdfUpload: document.getElementById('pdf-upload'),
        intervaloInput: document.getElementById('intervalo'),
        startRemindersBtn: document.getElementById('start-reminders'),
        stopRemindersBtn: document.getElementById('stop-reminders'),
        countdown: document.getElementById('countdown'),
        responseArea: document.getElementById('responseArea'),
        urlInput: document.getElementById('url-input'),
        pdfUploadResearch: document.getElementById('pdf-upload-research'),
        intervaloResearchInput: document.getElementById('intervalo-research'),
        startResearchBtn: document.getElementById('start-research'),
        stopResearchBtn: document.getElementById('stop-research'),
        researchArea: document.getElementById('researchArea'),
        chatArea: document.getElementById('chat-area'),
        sendQuestionBtn: document.getElementById('send-question'),
        rolSelect: document.getElementById('rol-select'),
        audioElement: document.getElementById('audio-element'),
        responseArea: document.getElementById('response-area')
    };

    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Elemento no encontrado en el DOM: ${key}`);
            return;
        }
    }

    let reminderInterval;
    let reminderCountdown;

    elements.startRemindersBtn.addEventListener('click', () => {
        const interval = parseInt(elements.intervaloInput.value) * 60;
        if (!interval || interval <= 0) {
            alert('Por favor, ingresa un intervalo válido en minutos.');
            return;
        }

        clearInterval(reminderInterval);
        clearInterval(reminderCountdown);
        startReminderCountdown(interval);

        reminderInterval = setInterval(async () => {
            try {
                const reminderResponse = await obtenerRespuestaAsistente('Generar recordatorio');
                elements.responseArea.innerText = reminderResponse.reply;
                if (reminderResponse.audioContent) {
                    elements.audioElement.src = `data:audio/mp3;base64,${reminderResponse.audioContent}`;
                    elements.audioElement.style.display = 'block';
                    elements.audioElement.play();
                }
            } catch (error) {
                console.error('Error obteniendo la respuesta del asistente:', error);
                alert('Error al obtener la respuesta del asistente.');
            }
            clearInterval(reminderCountdown); // Clear countdown interval when reminder is triggered
            startReminderCountdown(interval); // Restart countdown for the next reminder
        }, interval * 1000);

        alert('Recordatorios automáticos iniciados.');
    });

    elements.stopRemindersBtn.addEventListener('click', () => {
        clearInterval(reminderInterval);
        clearInterval(reminderCountdown);
        elements.countdown.innerText = '';
        alert('Recordatorios automáticos detenidos.');
    });

    function startReminderCountdown(interval) {
        let secondsRemaining = interval;

        reminderCountdown = setInterval(() => {
            elements.countdown.innerText = `Tiempo restante: ${secondsRemaining} segundos`;
            if (secondsRemaining <= 0) {
                clearInterval(reminderCountdown);
            } else {
                secondsRemaining--;
            }
        }, 1000);
    }

    elements.startResearchBtn.addEventListener('click', () => {
        const interval = parseInt(elements.intervaloResearchInput.value) * 60;
        if (!interval || interval <= 0) {
            alert('Por favor, ingresa un intervalo válido en minutos.');
            return;
        }
        // Lógica para iniciar investigación automática
        alert('Investigación automática iniciada.');
    });

    elements.stopResearchBtn.addEventListener('click', () => {
        // Lógica para detener investigación automática
        alert('Investigación automática detenida.');
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
            console.error('Error obteniendo la respuesta del chat:', error);
            alert('Error al obtener la respuesta del chat.');
        }
    });

    async function obtenerRespuestaAsistente(pregunta) {
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: pregunta, rol: 'recordatorios' })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error obteniendo la respuesta del asistente:', error);
            throw error;
        }
    }
});
