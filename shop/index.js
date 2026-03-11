module.exports = async function handleShopInteraction(interaction, db) {
  const value = interaction.values?.[0];
  const id = interaction.customId;


  // 🧢 قسم الرولات
  if (value === "section_roles" || id === "roles_menu") {
    return require("./roles")(interaction, db);
  }

  // 🚔 قسم السجن (تعديل مهم هنا 👇)
  if (
    value === "section_jail" ||
    id === "section_jail" ||
    id === "jail_menu" ||
    ["jail_action", "bail_action", "visit_action"].includes(value) ||
    ["confirm_mention_jail", "confirm_mention_bail", "confirm_visit"].includes(id)
  ) {
    return require("./jail")(interaction, db);
  }

  // 🎰 قسم القمار
  if (value === "section_gambling" || id === "gambling_menu") {
    return require("./gambling")(interaction, db);
  }

// ⚠️ قسم العقوبات
// ⚠️ قسم العقوبات
if (
  value === "section_punishments" ||
  id === "punishments_menu" ||
  id === "confirm_timeout" ||
  id === "confirm_mute" ||
  id === "confirm_steal"
) {
  return require("./punishments")(interaction, db);
}


  // 🎒 عرض الأغراض
  if (id === "shop_inventory") {
    return require("./inventory")(interaction, db);
  }

// 🔁 العودة
if (id === "shop_back") {
  return require("../commands/shop")(interaction, true); // نمرر فلاغ انه رجوع
}


};
