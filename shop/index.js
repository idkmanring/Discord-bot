const { assertShopOwner, getShopBaseId } = require("./utils");

module.exports = async function handleShopInteraction(interaction, db) {
  const ownerId = await assertShopOwner(interaction);
  if (!ownerId) return;

  const value = interaction.values?.[0];
  const id = getShopBaseId(interaction);


  // 🧢 قسم الامتيازات
  if (
    value === "section_roles" ||
    id === "roles_menu" ||
    id === "privileges_menu" ||
    id === "confirm_roles_purchase" ||
    id === "confirm_privileges_purchase" ||
    id === "shop_nickname_modal_self"
  ) {
    return require("./roles")(interaction, db);
  }

  const targetMode = id === "shop_target_select" || id === "shop_target_prev" || id === "shop_target_next"
    ? interaction.shopCustomExtra?.[0]
    : null;

  // 🚔 قسم السجن (تعديل مهم هنا 👇)
  if (
    value === "section_jail" ||
    id === "section_jail" ||
    id === "jail_menu" ||
    ["jail_action", "bail_action", "visit_action"].includes(value) ||
    ["confirm_mention_jail", "confirm_mention_bail", "confirm_visit"].includes(id) ||
    ["jail", "bail"].includes(targetMode)
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
  id === "confirm_steal" ||
  id === "confirm_rename_member" ||
  id === "shop_nickname_modal_target" ||
  targetMode === "punishment"
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
