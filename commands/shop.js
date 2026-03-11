const { ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder } = require("discord.js");

module.exports = async function handleShopCommand(ctx, isBack = false) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("shop_section_select")
    .setPlaceholder("اختر قسمًا من المتجر")
    .addOptions([
      { label: " الرولات", value: "section_roles", emoji: { id: "1409306750263361546", animated: false } },
      { label: " السجن", value: "section_jail", emoji: { id: "1409306741203800064", animated: false } },
      { label: " العقوبات", value: "section_punishments", emoji: { id: "1409306725563240450", animated: false } },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  const storeImg = new AttachmentBuilder("./assets/templates/Store.png", { name: "Store.png" });

  // 🚀 جاي من رسالة أمر (messageCreate)
if (ctx.author) {
  // جاي من أمر (رسالة مستخدم) → reply مرة واحدة فقط
  return ctx.reply({ files: [storeImg], components: [row] });
} else {
  // جاي من interaction (منيو أو زر العودة) → update نفس الرسالة
  return ctx.update({ files: [storeImg], components: [row] });
}
};
