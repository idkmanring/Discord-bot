const { ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder } = require("discord.js");
const { makeShopCustomId, parseShopCustomId } = require("../shop/utils");

module.exports = async function handleShopCommand(ctx, isBack = false) {
  const parsed = parseShopCustomId(ctx.customId);
  const ownerId = ctx.author?.id || parsed.ownerId || ctx.user?.id;

  const menu = new StringSelectMenuBuilder()
    .setCustomId(makeShopCustomId("shop_section_select", ownerId))
    .setPlaceholder("اختر قسمًا من المتجر")
    .addOptions([
      { label: " الميزات", value: "section_roles", emoji: { id: "1409306750263361546", animated: false } },
      { label: " السجن", value: "section_jail", emoji: { id: "1409306741203800064", animated: false } },
      { label: " العقوبات", value: "section_punishments", emoji: { id: "1409306725563240450", animated: false } },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  const storeImg = new AttachmentBuilder("./assets/templates/Store.png", { name: "Store.png" });

  // 🚀 جاي من رسالة أمر (messageCreate)
if (ctx.author) {
  // جاي من أمر (رسالة مستخدم) → reply مرة واحدة فقط
  return ctx.reply({ content: "", files: [storeImg], embeds: [], components: [row] });
} else {
  // جاي من interaction (منيو أو زر العودة) → update نفس الرسالة
  return ctx.update({ content: "", files: [storeImg], embeds: [], components: [row] });
}
};
