// commands/price.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQuote } = require('../lib/finance');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Affiche le prix actuel d\'une action')
    .addStringOption((opt) =>
      opt.setName('ticker').setDescription('Symbole boursier (ex: AAPL, TSLA)').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const ticker = interaction.options.getString('ticker');

    try {
      const quote = await getQuote(ticker);
      const sign = quote.change >= 0 ? '▲' : '▼';
      const color = quote.change >= 0 ? 0x2ecc71 : 0xe74c3c;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${quote.symbol} — ${quote.name}`)
        .addFields(
          { name: 'Prix', value: `**${quote.price.toFixed(2)} ${quote.currency}**`, inline: true },
          { name: 'Variation', value: `${sign} ${Math.abs(quote.change).toFixed(2)}%`, inline: true }
        )
        .setFooter({ text: 'Yahoo Finance' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `❌ ${err.message}`, ephemeral: true });
    }
  },
};
