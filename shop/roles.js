const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const {
  activateEffect,
  getBalance,
  getShopBaseId,
  getShopOwnerId,
  makeShopCustomId,
  recordTransaction,
  subtractBalance,
  validateNickname,
} = require("./utils");

const selectedPrivilegeItem = new Map();

const privilegeItems = [
  {
    itemId: "sugar_daddy",
    type: "role",
    name: "Sugar Daddy",
    description: "رول Sugar Daddy",
    roleId: "1388734284797444096",
    price: 100000,
  },
  {
    itemId: "sugar_mommy",
    type: "role",
    name: "Sugar Mommy",
    description: "رول Sugar Mommy",
    roleId: "1388734115825586207",
    price: 100000,
  },
  {
    itemId: "change_my_nickname",
    type: "self_nickname",
    name: "تغيير اسمي",
    description: "تغيير اسمك داخل السيرفر",
    price: 75000,
  },
  {
    itemId: "double_money_1h",
    type: "effect",
    effectKey: "double_money",
    name: "دبل فلوس لمدة ساعة",
    description: "مكافآت الألعاب تدخل دبل لمدة ساعة",
    price: 50000,
  },
  {
    itemId: "loss_protection_1h",
    type: "effect",
    effectKey: "loss_protection",
    name: "حماية من الخسارة لمدة ساعة",
    description: "أي خسارة لعبة تنحسب عليك بالنصف فقط",
    price: 50000,
  },
];

function getBuyerName(interaction, userId) {
  return (
    interaction.member?.displayName ||
    interaction.user?.globalName ||
    interaction.user?.username ||
    String(userId)
  );
}

function buildNicknameModal(ownerId) {
  const modal = new ModalBuilder()
    .setCustomId(makeShopCustomId("shop_nickname_modal_self", ownerId))
    .setTitle("تغيير اسمي");

  const input = new TextInputBuilder()
    .setCustomId("nickname")
    .setLabel("اكتب النك نيم الجديد")
    .setPlaceholder("من 1 إلى 32 حرف")
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(32)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

async function showPrivilegesMenu(interaction, ownerId) {
  const options = privilegeItems.map((item) => ({
    label: item.name,
    description: `${item.description} - ${item.price.toLocaleString("en-US")} ريال`,
    value: item.itemId,
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(makeShopCustomId("privileges_menu", ownerId))
    .setPlaceholder("اختر ميزة للشراء")
    .addOptions(options);

  const row1 = new ActionRowBuilder().addComponents(selectMenu);

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(makeShopCustomId("shop_back", ownerId))
      .setLabel(" العودة")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407426312603439226"),
    new ButtonBuilder()
      .setCustomId(makeShopCustomId("confirm_privileges_purchase", ownerId))
      .setLabel(" تأكيد الشراء")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1415979896433278986")
  );

  const rolesImg = new AttachmentBuilder("./assets/templates/Roles.png", { name: "Roles.png" });

  return interaction.update({
    content: "",
    embeds: [],
    files: [rolesImg],
    components: [row1, row2],
  });
}

async function handleRolePurchase(interaction, db, item, ownerId) {
  const guild = interaction.guild;
  const member = await guild.members.fetch(ownerId);
  const role = guild.roles.cache.get(item.roleId);

  if (!role) {
    return interaction.reply({ content: "هذا الرول غير موجود حاليًا في السيرفر.", ephemeral: true });
  }

  if (member.roles.cache.has(role.id)) {
    return interaction.reply({ content: "لديك هذا الرول بالفعل.", ephemeral: true });
  }

  const balance = await getBalance(ownerId, db);
  if (balance < item.price) {
    return interaction.reply({ content: `رصيدك غير كافٍ. السعر: ${item.price.toLocaleString("en-US")} ريال`, ephemeral: true });
  }

  await member.roles.add(role);
  await subtractBalance(ownerId, item.price, db);

  const balanceAfter = await getBalance(ownerId, db);
  await recordTransaction(db, {
    userId: ownerId,
    userName: getBuyerName(interaction, ownerId),
    amount: -item.price,
    reason: `شراء رول: ${item.name}`,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    ref: { type: "shop_role", itemId: item.itemId, roleId: item.roleId },
    balanceAfter,
  });

  return interaction.reply({
    content: `تم شراء الرول **${item.name}** بمبلغ ${item.price.toLocaleString("en-US")} ريال.`,
    ephemeral: true,
  });
}

async function handleEffectPurchase(interaction, db, item, ownerId) {
  const balance = await getBalance(ownerId, db);
  if (balance < item.price) {
    return interaction.reply({ content: `رصيدك غير كافٍ. السعر: ${item.price.toLocaleString("en-US")} ريال`, ephemeral: true });
  }

  await subtractBalance(ownerId, item.price, db);
  const expiresAt = await activateEffect(ownerId, item.effectKey, db);

  const balanceAfter = await getBalance(ownerId, db);
  await recordTransaction(db, {
    userId: ownerId,
    userName: getBuyerName(interaction, ownerId),
    amount: -item.price,
    reason: `شراء ميزة: ${item.name}`,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    ref: { type: "shop_effect", itemId: item.itemId, effectKey: item.effectKey, expiresAt },
    balanceAfter,
  });

  return interaction.reply({
    content: `تم تفعيل **${item.name}** إلى <t:${Math.floor(expiresAt.getTime() / 1000)}:R>.`,
    ephemeral: true,
  });
}

async function handleSelfNicknameModal(interaction, db, ownerId) {
  const validation = validateNickname(interaction.fields.getTextInputValue("nickname"));
  if (!validation.ok) {
    return interaction.reply({ content: validation.reason, ephemeral: true });
  }

  const item = privilegeItems.find((it) => it.itemId === "change_my_nickname");
  const member = await interaction.guild.members.fetch(ownerId).catch(() => null);
  if (!member) {
    return interaction.reply({ content: "لم أستطع العثور على عضويتك في السيرفر.", ephemeral: true });
  }

  if (!member.manageable) {
    return interaction.reply({ content: "لا أستطيع تغيير اسم هذا العضو بسبب الصلاحيات أو ترتيب الرتب.", ephemeral: true });
  }

  const balance = await getBalance(ownerId, db);
  if (balance < item.price) {
    return interaction.reply({ content: `رصيدك غير كافٍ. السعر: ${item.price.toLocaleString("en-US")} ريال`, ephemeral: true });
  }

  await member.setNickname(validation.nickname, `Shop nickname change by ${ownerId}`);
  await subtractBalance(ownerId, item.price, db);

  const balanceAfter = await getBalance(ownerId, db);
  await recordTransaction(db, {
    userId: ownerId,
    userName: getBuyerName(interaction, ownerId),
    amount: -item.price,
    reason: `تغيير اسم: ${validation.nickname}`,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    ref: { type: "shop_self_nickname", nickname: validation.nickname },
    balanceAfter,
  });

  selectedPrivilegeItem.delete(ownerId);
  return interaction.reply({ content: `تم تغيير اسمك إلى **${validation.nickname}**.`, ephemeral: true });
}

module.exports = async function handleRolesSection(interaction, db) {
  const id = getShopBaseId(interaction);
  const ownerId = getShopOwnerId(interaction);

  if (id === "shop_nickname_modal_self") {
    return handleSelfNicknameModal(interaction, db, ownerId);
  }

  if (
    interaction.values?.[0] === "section_roles" ||
    id === "roles_menu" ||
    (id !== "privileges_menu" && id !== "confirm_roles_purchase" && id !== "confirm_privileges_purchase")
  ) {
    return showPrivilegesMenu(interaction, ownerId);
  }

  if (id === "privileges_menu") {
    const itemId = interaction.values?.[0];
    const item = privilegeItems.find((it) => it.itemId === itemId);
    if (!item) {
      return interaction.reply({ content: "هذه الميزة غير متاح.", ephemeral: true });
    }

    selectedPrivilegeItem.set(ownerId, itemId);
    return interaction.reply({ content: `تم اختيار: **${item.name}**`, ephemeral: true });
  }

  if (id === "confirm_roles_purchase" || id === "confirm_privileges_purchase") {
    const itemId = selectedPrivilegeItem.get(ownerId);
    if (!itemId) {
      return interaction.reply({ content: "اختر ميزة أولًا.", ephemeral: true });
    }

    const item = privilegeItems.find((it) => it.itemId === itemId);
    if (!item) {
      selectedPrivilegeItem.delete(ownerId);
      return interaction.reply({ content: "هذه الميزة لم تعد متاحة.", ephemeral: true });
    }

    if (item.type === "self_nickname") {
      return interaction.showModal(buildNicknameModal(ownerId));
    }

    if (item.type === "effect") {
      return handleEffectPurchase(interaction, db, item, ownerId);
    }

    return handleRolePurchase(interaction, db, item, ownerId);
  }
};

