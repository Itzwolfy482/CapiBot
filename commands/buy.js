// commands/buy.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQuote } = require('../lib/finance');
const { getBalance, updateBalance } = require('../lib/unbelieva');
const { getHolding, upsertHolding, logTransaction } = require('../lib/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Achète des actions avec ton solde')
    .addStringOption((opt) =>
      opt.setName('ticker').setDescription('Symbole boursier (ex: AAPL)').setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName('quantity').setDescription('Nombre d\'actions').setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const ticker = interaction.options.getString('ticker').toUpperCase();
    const quantity = interaction.options.getInteger('quantity');
    const userId = interaction.user.id;

    try {
      const [quote, balance] = await Promise.all([
        getQuote(ticker),
        getBalance(userId),
      ]);

      const total = quote.price * quantity;

      if (balance.cash < total) {
        return interaction.editReply({
          content: `❌ Solde insuffisant — il te faut **${total.toFixed(2)}** mais tu n'as que **${balance.cash}**.`,
          ephemeral: true,
        });
      }

      // Déduire le montant
      await updateBalance(userId, -Math.round(total), `Achat ${quantity}x ${ticker}`);

      // Mettre à jour le portfolio (prix moyen pondéré)
      const holding = getHolding(userId, ticker);
      let newQty, newAvg;
      if (holding) {
        newQty = holding.quantity + quantity;
        newAvg = (holding.avg_price * holding.quantity + quote.price * quantity) / newQty;
      } else {
        newQty = quantity;
        newAvg = quote.price;
      }
      upsertHolding(userId, ticker, newQty, newAvg);
      logTransaction(userId, ticker, 'buy', quantity, quote.price);

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('✅ Achat confirmé')
        .addFields(
          { name: 'Action', value: `${ticker} — ${quote.name}`, inline: false },
          { name: 'Quantité', value: `${quantity}`, inline: true },
          { name: 'Prix unitaire', value: `${quote.price.toFixed(2)} ${quote.currency}`, inline: true },
          { name: 'Total dépensé', value: `${total.toFixed(2)}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `❌ ${err.message}`, ephemeral: true });
    }
  },
};
