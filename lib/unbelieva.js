// lib/unbelieva.js
// Wrapper minimal pour l'API UnbelievaBoat

const axios = require('axios');

const BASE_URL = 'https://unbelievaboat.com/api/v1';
const GUILD_ID = process.env.GUILD_CURRENCY_ID;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: process.env.UNBELIEVA_TOKEN,
  },
});

/**
 * Récupère le solde d'un utilisateur.
 * @returns {{ cash: number, bank: number, total: number }}
 */
async function getBalance(userId) {
  const res = await api.get(`/guilds/${GUILD_ID}/users/${userId}`);
  return res.data;
}

/**
 * Modifie le cash d'un utilisateur (positif = ajouter, négatif = retirer).
 * @returns {{ cash: number, bank: number, total: number }}
 */
async function updateBalance(userId, cashDelta, reason = '') {
  const res = await api.patch(`/guilds/${GUILD_ID}/users/${userId}`, {
    cash: cashDelta,
    reason,
  });
  return res.data;
}

module.exports = { getBalance, updateBalance };
