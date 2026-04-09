// commands/portfolio.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQuote } = require('../lib/finance');
const { getPortfolio } = require('../lib/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('portfolio')
    .setDescription('Affiche ton portfolio d\'actions'),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;

    const holdings = getPortfolio(userId);

    if (holdings.length === 0) {
      return interaction.editReply({ content: 'Tu ne possèdes aucune action pour l\'instant.' });
    }

    // Récupère les prix en parallèle
    const quotes = await Promise.allSettled(holdings.map((h) => getQuote(h.symbol)));

    let totalValue = 0;
    let totalCost = 0;
    const lines = [];

    for (let i = 0; i < holdings.length; i++) {
      const h = holdings[i];
      const q = quotes[i];

      if (q.status === 'fulfilled') {
        const value = q.value.price * h.quantity;
        const cost = h.avg_price * h.quantity;
        const pnl = value - cost;
        const pnlPct = ((pnl / cost) * 100).toFixed(2);
        const sign = pnl >= 0 ? '▲' : '▼';
        totalValue += value;
        totalCost += cost;
        lines.push(
          `**${h.symbol}** × ${h.quantity} | ${q.value.price.toFixed(2)} | ${sign} ${Math.abs(pnlPct)}%`
        );
      } else {
        lines.push(`**${h.symbol}** × ${h.quantity} | prix indisponible`);
      }
    }

    const totalPnl = totalValue - totalCost;
    const totalPnlSign = totalPnl >= 0 ? '+' : '';

    const embed = new EmbedBuilder()
      .setColor(totalPnl >= 0 ? 0x2ecc71 : 0xe74c3c)
      .setTitle(`📈 Portfolio de ${interaction.user.displayName}`)
      .setDescription(lines.join('\n'))
      .addFields(
        { name: 'Valeur totale', value: `${totalValue.toFixed(2)}`, inline: true },
        { name: 'P&L total', value: `${totalPnlSign}${totalPnl.toFixed(2)}`, inline: true }
      )
      .setFooter({ text: 'Prix en temps réel via Yahoo Finance' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
