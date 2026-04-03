// commands/minigames.js
const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = async function handleMinigamesCommand(message) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("minigame_menu")
      .setPlaceholder(" اختر لعبة")
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel(" فكّك").setValue("fakkak").setEmoji("1416010648818815016"),
        new StringSelectMenuOptionBuilder().setLabel(" جمّع").setValue("jam3").setEmoji("1416010655340695654"),
        new StringSelectMenuOptionBuilder().setLabel(" أسرع").setValue("asra3").setEmoji("1416010645937061958"),
        new StringSelectMenuOptionBuilder().setLabel(" ركّب").setValue("rakkib").setEmoji("1416010651834257409"),
        new StringSelectMenuOptionBuilder().setLabel("اعلام دول").setValue("flags_country").setEmoji("1416010643248517162"),
        new StringSelectMenuOptionBuilder().setLabel("عواصم دول").setValue("flags_capital").setEmoji("1416010657689763912"),
        // الألعاب الجديدة هنا 👇
        new StringSelectMenuOptionBuilder().setLabel(" حرف").setValue("harf").setEmoji("1416507901425614948"),
        new StringSelectMenuOptionBuilder().setLabel("حروف").setValue("wordle").setEmoji("📝"),
       // new StringSelectMenuOptionBuilder().setLabel(" تحدي الصور").setValue("pic_challenge").setEmoji("🖼️"),
       // new StringSelectMenuOptionBuilder().setLabel(" سلسلة الكلمات").setValue("chained_words").setEmoji("🔗"),
        new StringSelectMenuOptionBuilder().setLabel(" فاميلي فيود").setValue("feud").setEmoji("👨‍👩‍👧‍👦"),
        new StringSelectMenuOptionBuilder().setLabel("الدوامة").setValue("dawama").setEmoji("🎡") // 🔴 إضافة اللعبة للقائمة
      )
  );

  const statsButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("minigame_stats")
      .setLabel("احصائياتي")
      .setEmoji("1407426721619382313")
      .setStyle(ButtonStyle.Secondary)
  );

  await message.reply({
    content: " اختر واحدة من ألعاب الميني جيم التالية:",
    components: [row, statsButton]
  });
}
