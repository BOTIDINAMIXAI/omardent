async function getChatResponse(input) {
    const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input })
    });
    const data = await response.json();
    return data.reply;
}

async function getSpeech(audioText) {
    const response = await fetch('/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: audioText })
    });
    const data = await response.json();
    const audio = new Audio('data:audio/mp3;base64,' + data.audioContent);

    const video = document.getElementById('video-element');
    
    audio.addEventListener('play', () => {
        video.currentTime = 0;  // Reinicia el video al inicio
        video.play();  // Reproduce el video
    });

    audio.addEventListener('ended', () => {
        video.pause();  // Pausa el video cuando el audio termina
    });

    video.addEventListener('ended', () => {
        if (!audio.paused) {
            video.currentTime = 0;  // Reinicia el video al inicio
            video.play();  // Reproduce el video nuevamente
        }
    });

    audio.play();
}

document.getElementById('start-button').addEventListener('click', async () => {
    const input = document.getElementById('textArea').value;
    const chatResponse = await getChatResponse(input);
    await getSpeech(chatResponse);
});

async function captureVoice() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioBuffer = await audioBlob.arrayBuffer();
        const audioBase64 = arrayBufferToBase64(audioBuffer);

        const response = await fetch('/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioContent: audioBase64 })
        });
        const data = await response.json();
        const transcription = data.transcription;

        const chatResponse = await getChatResponse(transcription);
        await getSpeech(chatResponse);
    };

    mediaRecorder.start();

    setTimeout(() => {
        mediaRecorder.stop();
    }, 5000); // Graba por 5 segundos
}

document.getElementById('start-voice-button').addEventListener('click', captureVoice);

document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById('file-input');
    formData.append('file', fileInput.files[0]);

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
});

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
