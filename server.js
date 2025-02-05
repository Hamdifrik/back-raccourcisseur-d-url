import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import validUrl from 'valid-url';
import { nanoid } from 'nanoid';

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Middleware
app.use(express.json());
app.use(cors());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI);


// Modèle MongoDB
const UrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortId: String,
});
const Url = mongoose.model('Url', UrlSchema);

// Endpoint pour raccourcir une URL
app.post('/shorten', async (req, res) => {
  const { url } = req.body;

  if (!validUrl.isUri(url)) {
    return res.status(400).json({ error: 'URL invalide' });
  }

  let existingUrl = await Url.findOne({ originalUrl: url });
  if (existingUrl) {
    return res.json({ shortUrl: `${BASE_URL}/${existingUrl.shortId}` });
  }

  const shortId = nanoid(6);
  const newUrl = new Url({ originalUrl: url, shortId });
  await newUrl.save();

  res.json({ shortUrl: `${BASE_URL}/${shortId}` });
});

// Endpoint pour rediriger vers l'URL originale
app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  const urlEntry = await Url.findOne({ shortId });

  if (urlEntry) {
    return res.redirect(urlEntry.originalUrl);
  } else {
    return res.status(404).json({ error: 'URL non trouvée' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
