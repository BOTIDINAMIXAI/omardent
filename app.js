require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const path = require('path');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

// Configura la clave de API de OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("No API key provided for OpenAI. Please set your API key in the .env file.");
    process.exit(1);  // Termina el proceso si no se proporciona la clave API
}

// Configurar Google Cloud Text-to-Speech
const ttsClient = new textToSpeech.TextToSpeechClient();

const port = 3000;
const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/tratamientos', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'tratamientos.html'));
});

app.get('/reservas', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'reservas.html'));
});

app.get('/insumos', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'insumos.html'));
});

app.get('/automatizaciones', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'automatizaciones.html'));
});

app.get('/laboratorio', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'Laboratorio.html'));
});


// Función para leer el contenido del archivo
const readFileContent = (filePath, ext) => {
    return new Promise((resolve, reject) => {
        if (ext === '.txt') {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        } else if (ext === '.pdf') {
            fs.readFile(filePath, (err, data) => {
                if (err) return reject(err);
                pdf(data).then((result) => resolve(result.text)).catch(reject);
            });
        } else if (ext === '.docx') {
            mammoth.extractRawText({ path: filePath })
                .then((result) => resolve(result.value))
                .catch(reject);
        } else {
            reject(new Error('Unsupported file type'));
        }
    });
};

let additionalContext = '';

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded');
    }

    const ext = path.extname(file.filename).toLowerCase();
    const filePath = file.path;

    try {
        const content = await readFileContent(filePath, ext);
        additionalContext = content;
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
        });
        res.send('Archivo subido exitosamente y contexto actualizado');
    } catch (error) {
        console.error('Error reading uploaded file:', error);
        res.status(500).send('Error reading uploaded file');
    }
});

// Endpoint para subir URL
app.post('/upload-url', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).send('URL no proporcionada');
    }

    try {
        const response = await axios.get(url);
        additionalContext = response.data;
        res.send('URL cargada exitosamente y contexto actualizado');
    } catch (error) {
        console.error('Error al leer la URL:', error);
        res.status(500).send('Error al leer la URL');
    }
});

// Función para generar respuestas con GPT-4
const generarRespuestaGPT = async (instrucciones, rol) => {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo-16k",
                messages: [
                    { role: "system", content: "Actúa como Galatea, la auxiliar capacitada de la clínica odontológica Omardent y resuelve dudas e inquietudes, en un tono carismático y amable." },
                    { role: "system", content: `Información adicional: ${additionalContext}` }, // Agregar contexto adicional
                    { role: "user", content: `Rol: ${rol}. Instrucciones: ${instrucciones}` }
                ],
                max_tokens: 150, // Limitar el número de tokens para respuestas más cortas
                temperature: 0.5
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generando la respuesta con GPT-4:', error);
        throw error;
    }
};

// Endpoint para chat
app.post('/chat', async (req, res) => {
    const userInput = req.body.input;
    const rol = req.body.rol;
    if (!userInput) {
        return res.status(400).json({ error: 'Input text is required' });
    }
    try {
        const chatResponse = await generarRespuestaGPT(userInput, rol);
        const synthesizedSpeech = await synthesizeSpeech(chatResponse); // Generar voz
        res.json({ reply: chatResponse, audioContent: synthesizedSpeech });
    } catch (error) {
        res.status(500).json({ error: 'Error generating chat response' });
    }
});

// Endpoint para síntesis de voz
const synthesizeSpeech = async (text) => {
    const request = {
        input: { text: text },
        voice: { languageCode: 'es-ES', ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' },
    };
    try {
        const [response] = await ttsClient.synthesizeSpeech(request);
        return response.audioContent.toString('base64');
    } catch (error) {
        console.error('Error sintetizando el texto a voz:', error);
        throw error;
    }
};

const citasProgramadas = [];

function parseCitas(content) {
    // Implementa la lógica para extraer citas del contenido del archivo
    // Suponiendo que cada línea del archivo contiene una cita en el formato: "fecha,hora,paciente"
    const citas = content.split('\n').map(line => {
        const [fecha, hora, paciente] = line.split(',');
        return { fecha, hora, paciente };
    });
    return citas;
}

app.post('/horarios-disponibles', (req, res) => {
    const { fecha } = req.body;
    const horariosDisponibles = getHorariosDisponibles(fecha);
    res.json(horariosDisponibles);
});

function getHorariosDisponibles(fecha) {
    const horariosDeTrabajo = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', 
                                '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', 
                                '17:00', '17:15', '17:30', '17:45', '18:00'];
    const horariosOcupados = citasProgramadas
        .filter(cita => cita.fecha === fecha)
        .map(cita => cita.hora);

    return horariosDeTrabajo.filter(hora => !horariosOcupados.includes(hora));
}

const server = http.createServer(app);
server.listen(port, () => console.log(`Server started on port localhost:${port}\nhttp://localhost:${port}`));
