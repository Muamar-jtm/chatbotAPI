import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// tambahan untuk mendapatkan __dirname di ES module / import style
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());
// tambahan middleware untuk melayani file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
app.listen(PORT, ()=> console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) =>{
    const { conversation } = req.body;
    try {
        if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');
        const contents = conversation.map(({ role, text }) =>({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.8,
                systemInstruction: `
                Kamu adalah asisten virtual BPRS Vitka Central. Kamu akan membantu menjawab pertanyaan terkait produk dan layanan BPRS 
                Vitka Central. Jika pertanyaan tidak terkait dengan produk dan layanan BPRS Vitka Central, 
                jawab dengan sopan dan arahkan untuk mengunjungi bprsvitkacentral.com. Jawab hanya menggunakan bahasa Indonesia. 
                Jika tidak tahun jawabannya katakan silahkan kunjungi bprsvitkacentral.com
                `
            },
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});