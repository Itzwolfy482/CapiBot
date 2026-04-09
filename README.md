# StockBot — Fondations

Bot Discord de trading simulé. Les utilisateurs achètent/vendent des actions réelles avec la monnaie du serveur via UnbelievaBoat.

## Stack
- **discord.js v14** — slash commands
- **yahoo-finance2** — prix en temps réel
- **UnbelievaBoat API** — gestion du solde
- **sql.js** — portfolio persisté localement (même approche que PolyBot)

## Setup

```bash
npm install
cp .env.example .env
# Remplir .env

# Déployer les commandes (dev : guild-only, instantané)
npm run deploy

# Lancer
npm start
```

## Commandes

| Commande | Description |
|---|---|
| `/price <ticker>` | Prix actuel d'une action |
| `/buy <ticker> <quantity>` | Acheter des actions (débite le cash) |
| `/sell <ticker> <quantity>` | Vendre des actions (crédite le cash), 0 = tout vendre |
| `/portfolio` | Affiche ton portfolio avec P&L |

## Structure

```
stockbot/
├── commands/
│   ├── price.js
│   ├── buy.js
│   ├── sell.js
│   └── portfolio.js
├── lib/
│   ├── db.js          ← sql.js (portfolio + transactions)
│   ├── finance.js     ← Yahoo Finance wrapper
│   └── unbelieva.js   ← UnbelievaBoat wrapper
├── data/
│   └── stocks.db      ← généré automatiquement
├── index.js
├── deploy-commands.js
└── .env
```

## Notes

- Le prix Yahoo Finance est en USD, le solde UnbelievaBoat est en monnaie serveur — à toi de décider si tu appliques un taux de conversion ou si tu considères 1 = 1$.
- `updateBalance` arrondit au plus proche entier (UnbelievaBoat ne gère pas les décimales).
- Pour la prod, dans `deploy-commands.js`, remplacer `applicationGuildCommands` par `applicationCommands`.
