// commands/minigames.js
const path = require("path");
const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");

module.exports = async function handleMinigamesCommand(ctx) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("minigame_menu")
      .setPlaceholder(" اختر لعبة")
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel(" فكّك").setValue("fakkak").setEmoji("1416010648818815016"),
        new StringSelectMenuOptionBuilder().setLabel(" جمّع").setValue("jam3").setEmoji("1416010655340695654"),
        new StringSelectMenuOptionBuilder().setLabel(" أسرع").setValue("asra3").setEmoji("1416010645937061958"),
        new StringSelectMenuOptionBuilder().setLabel("اعلام دول").setValue("flags_country").setEmoji("1416010643248517162"),
        new StringSelectMenuOptionBuilder().setLabel("عواصم دول").setValue("flags_capital").setEmoji("1416010657689763912"),
        new StringSelectMenuOptionBuilder().setLabel("دول").setValue("countries").setEmoji("🌍"),
        new StringSelectMenuOptionBuilder().setLabel(" حرف").setValue("harf").setEmoji("1416507901425614948"),
        new StringSelectMenuOptionBuilder().setLabel("حروف").setValue("wordle").setEmoji("📝"),
        // new StringSelectMenuOptionBuilder().setLabel(" تحدي الصور").setValue("pic_challenge").setEmoji("🖼️"),
        // new StringSelectMenuOptionBuilder().setLabel(" سلسلة الكلمات").setValue("chained_words").setEmoji("🔗"),
        new StringSelectMenuOptionBuilder().setLabel(" فاميلي فيود").setValue("feud").setEmoji("👨‍👩‍👧‍👦"),
        new StringSelectMenuOptionBuilder().setLabel("الدوامة").setValue("dawama").setEmoji("🎡"),
        new StringSelectMenuOptionBuilder().setLabel("كلمة السر").setValue("password").setEmoji("🔒"),
        new StringSelectMenuOptionBuilder().setLabel("الإمبوستر ").setValue("imposter").setEmoji("🕵️‍♂️"))
  );

  const statsButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("minigame_stats")
      .setLabel("احصائياتي")
      .setEmoji("1407426721619382313")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("back_to_main")
      .setLabel(" رجوع")
      .setEmoji("1407426312603439226")
      .setStyle(ButtonStyle.Secondary)
  );

  const payload = {
    content: " اختر واحدة من ألعاب الميني جيم التالية:",
    files: [new AttachmentBuilder(path.join(__dirname, "..", "assets", "templates", "manygames.png"))],
    components: [row, statsButton]
  };

  if (ctx.author) return ctx.reply(payload);
  return ctx.update(payload);
}
