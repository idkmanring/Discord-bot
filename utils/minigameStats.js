// utils/minigameStats.js
const { EmbedBuilder } = require("discord.js");

module.exports = async function showMinigameStats(interaction, db) {
  const userId = interaction.user.id;
  const doc = await db.collection("minigame_stats").findOne({ userId });
  const stats = doc?.games || {};

  const games = [
    { key: "fakkak", name: "فكّك <:icons8bigpuzzle1001:1416010648818815016> " },
    { key: "jam3", name: "جمّع <:icons8puzzlematching100:1416010655340695654> " },
    { key: "asra3", name: "أسرع <:icons8fast100:1416010645937061958> " },
    { key: "rakkib", name: "ركّب <:icons8bigpuzzle100:1416010651834257409> " },
    { key: "flags_country", name: "اعلام دول <:icons8saudiarabia100:1416010643248517162> " },
    { key: "flags_capital", name: "عواصم دول <:icons8country100:1416010657689763912>" }
  ];

  const embed = new EmbedBuilder()
    .setTitle(` إحصائيات ألعاب الميني جيم لـ ${interaction.user.username}`)
    .setColor("Green");

  let totalScore = 0;

  for (const game of games) {
    const s = stats[game.key] || { wins: 0, played: 0 };
    const percent = s.played > 0 ? ((s.wins / s.played) * 100).toFixed(1) : "0";
    totalScore += s.wins * 1000;
    embed.addFields({
      name: `${game.name}`,
      value: ` صحيحة: ${s.wins} / ${s.played} <:icons8correct1002:1415979896433278986>\n
       <:ryal:1407444550863032330> ${s.wins * 1000}\n
        نسبة الفوز: ${percent}%`,
      inline: true
    });
  }

  embed.setFooter({ text: `الإجمالي: ${totalScore.toLocaleString('en-US')}  ريال` });
  return interaction.reply({ embeds: [embed], ephemeral: true });
}
