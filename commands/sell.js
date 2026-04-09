// commands/sell.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQuote } = require('../lib/finance');
const { updateBalance } = require('../lib/unbelieva');
const { getHolding, upsertHolding, logTransaction } = require('../lib/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Vends des actions de ton portfolio')
    .addStringOption((opt) =>
      opt.setName('ticker').setDescription('Symbole boursier (ex: AAPL)').setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName('quantity').setDescription('Nombre d\'actions (0 = tout vendre)').setRequired(true).setMinValue(0)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const ticker = interaction.options.getString('ticker').toUpperCase();
    const userId = interaction.user.id;

    try {
      const holding = getHolding(userId, ticker);
      if (!holding || holding.quantity <= 0) {
        return interaction.editReply({ content: `❌ Tu ne possèdes pas de **${ticker}**.`, ephemeral: true });
      }

      let quantity = interaction.options.getInteger('quantity');
      if (quantity === 0) quantity = holding.quantity; // tout vendre

      if (quantity > holding.quantity) {
        return interaction.editReply({
          content: `❌ Tu ne possèdes que **${holding.quantity}** actions de ${ticker}.`,
          ephemeral: true,
        });
      }

      const quote = await getQuote(ticker);
      const total = quote.price * quantity;
      const pnl = (quote.price - holding.avg_price) * quantity;
      const pnlSign = pnl >= 0 ? '+' : '';

      // Créditer le montant
      await updateBalance(userId, Math.round(total), `Vente ${quantity}x ${ticker}`);

      // Mettre à jour le portfolio
      const newQty = holding.quantity - quantity;
      upsertHolding(userId, ticker, newQty, holding.avg_price);
      logTransaction(userId, ticker, 'sell', quantity, quote.price);

      const embed = new EmbedBuilder()
        .setColor(pnl >= 0 ? 0x2ecc71 : 0xe74c3c)
        .setTitle('✅ Vente confirmée')
        .addFields(
          { name: 'Action', value: `${ticker} — ${quote.name}`, inline: false },
          { name: 'Quantité vendue', value: `${quantity}`, inline: true },
          { name: 'Prix unitaire', value: `${quote.price.toFixed(2)} ${quote.currency}`, inline: true },
          { name: 'Total reçu', value: `${total.toFixed(2)}`, inline: true },
          { name: 'P&L', value: `${pnlSign}${pnl.toFixed(2)}`, inline: true },
          { name: 'Restant', value: `${newQty} actions`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `❌ ${err.message}`, ephemeral: true });
    }
  },
};
