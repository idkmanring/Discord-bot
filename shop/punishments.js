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
  getBalance,
  getShopBaseId,
  getShopCustomExtra,
  getShopOwnerId,
  makeShopCustomId,
  recordTransaction,
  subtractBalance,
  validateNickname,
} = require("./utils");
const {
  buildTargetComponents,
  fetchSelectableMembers,
  mergeSelectionAcrossPages,
} = require("./targetSelect");

const timeoutPrice = 50000;
const mutePrice = 30000;
const stealPrice = 25000;
const renamePrice = 100000;
const muteRoleId = "1393698797170724874";

const targetMap = new Map();

const actions = {
  timeout_action: {
    title: "تايم أوت <:icons8timeout100:1409299705371955240>",
    price: timeoutPrice,
    buttonId: "confirm_timeout",
  },
  mute_action: {
    title: "كتم <:icons8mute100:1409299716813881456>",
    price: mutePrice,
    buttonId: "confirm_mute",
  },
  steal_action: {
    title: "خصم عشوائي <:icons8moneyloss100:1409298360090886224>",
    price: stealPrice,
    buttonId: "confirm_steal",
  },
  rename_action: {
    title: "تغيير اسم شخص",
    price: renamePrice,
    buttonId: "confirm_rename_member",
  },
};

function displayName(memberOrInteraction, fallbackId) {
  return (
    memberOrInteraction?.member?.displayName ||
    memberOrInteraction?.displayName ||
    memberOrInteraction?.user?.globalName ||
    memberOrInteraction?.user?.username ||
    memberOrInteraction?.username ||
    String(fallbackId)
  );
}

function buildTargetModal(ownerId) {
  const modal = new ModalBuilder()
    .setCustomId(makeShopCustomId("shop_nickname_modal_target", ownerId))
    .setTitle("تغيير اسم شخص");

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

function getSelection(ownerId) {
  return targetMap.get(ownerId) || { ids: [], action: null, members: [], page: 0 };
}

async function showPunishmentsMenu(interaction, ownerId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(makeShopCustomId("punishments_menu", ownerId))
    .setPlaceholder("اختر نوع العقوبة")
    .addOptions([
      { label: " تايم أوت 5 دقائق", value: "timeout_action", description: `السعر: ${timeoutPrice.toLocaleString("en-US")} ريال`, emoji: { id: "1409299705371955240", animated: false } },
      { label: " كتم لمدة 5 دقائق", value: "mute_action", description: `السعر: ${mutePrice.toLocaleString("en-US")} ريال`, emoji: { id: "1409299716813881456", animated: false } },
      { label: " خصم عشوائي من الرصيد", value: "steal_action", description: `السعر: ${stealPrice.toLocaleString("en-US")} ريال`, emoji: { id: "1409298360090886224", animated: false } },
      { label: " تغيير اسم شخص", value: "rename_action", description: `السعر: ${renamePrice.toLocaleString("en-US")} ريال` },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(makeShopCustomId("shop_back", ownerId))
      .setLabel(" العودة")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407426312603439226")
  );
  const img = new AttachmentBuilder("./assets/templates/Punishment.png", { name: "Punishment.png" });

  return interaction.update({
    content: "",
    files: [img],
    embeds: [],
    components: [row, backRow],
  });
}

async function promptForTarget(interaction, ownerId, actionKey) {
  const action = actions[actionKey];
  const members = await fetchSelectableMembers(interaction, { ownerId });
  const state = { ids: [], action: actionKey, members, page: 0 };
  targetMap.set(ownerId, state);
  const components = buildTargetComponents({
    ownerId,
    mode: "punishment",
    page: 0,
    members,
    selectedIds: state.ids,
    confirmId: action.buttonId,
    confirmLabel: actionKey === "rename_action" ? "تحديد الاسم" : " تأكيد العقوبة",
    placeholder: `${action.title} - اختر الأعضاء`,
  });
  const img = new AttachmentBuilder("./assets/templates/Punishment.png", { name: "Punishment.png" });
  const embed = {
    title: action.title,
    description: `<:usersolidfull:1407422287652720750> اختر عضوًا أو أكثر من القائمة. السعر يحسب لكل عضو: **${action.price.toLocaleString("en-US")} ريال**.`,
    color: 0xff0000,
  };

  return interaction.update({
    content: "",
    files: [img],
    embeds: [embed],
    components,
  });
}

async function renderPunishmentTargetPage(interaction, ownerId, page = 0) {
  const state = getSelection(ownerId);
  if (!state.action || !actions[state.action]) {
    return interaction.reply({ content: "اختر العقوبة من جديد.", ephemeral: true }).catch(() => {});
  }

  const action = actions[state.action];
  const components = buildTargetComponents({
    ownerId,
    mode: "punishment",
    page,
    members: state.members || [],
    selectedIds: state.ids || [],
    confirmId: action.buttonId,
    confirmLabel: state.action === "rename_action" ? "تحديد الاسم" : " تأكيد العقوبة",
    placeholder: `${action.title} - اختر الأعضاء`,
  });

  const img = new AttachmentBuilder("./assets/templates/Punishment.png", { name: "Punishment.png" });
  const embed = {
    title: action.title,
    description: `<:usersolidfull:1407422287652720750> المحدد حاليًا: **${(state.ids || []).length}**. السعر لكل عضو: **${action.price.toLocaleString("en-US")} ريال**.`,
    color: 0xff0000,
  };

  state.page = page;
  targetMap.set(ownerId, state);
  return interaction.update({ content: "", files: [img], embeds: [embed], components });
}

async function handleRenameModal(interaction, db, ownerId) {
  const validation = validateNickname(interaction.fields.getTextInputValue("nickname"));
  if (!validation.ok) {
    return interaction.reply({ content: validation.reason, ephemeral: true });
  }

  const data = getSelection(ownerId);
  const targetIds = [...new Set(data.ids || [])];
  if (!targetIds.length) {
    return interaction.reply({ content: "لم يتم اختيار أي عضو.", ephemeral: true });
  }

  const targets = [];
  for (const targetId of targetIds) {
    const target = await interaction.guild.members.fetch(targetId).catch(() => null);
    if (target && target.manageable && !target.user.bot && target.id !== ownerId) targets.push(target);
  }

  if (!targets.length) {
    return interaction.reply({ content: "لا أستطيع تغيير أسماء الأعضاء المحددين بسبب الصلاحيات أو ترتيب الرتب.", ephemeral: true });
  }

  const totalPrice = renamePrice * targets.length;
  const balance = await getBalance(ownerId, db);
  if (balance < totalPrice) {
    return interaction.reply({ content: `رصيدك غير كافٍ. السعر: ${totalPrice.toLocaleString("en-US")} ريال`, ephemeral: true });
  }

  await subtractBalance(ownerId, totalPrice, db);

  const changed = [];
  for (const target of targets) {
    await target.setNickname(validation.nickname, `Shop punishment nickname change by ${ownerId}`).catch(() => {});

    const actorName = displayName(interaction, ownerId);
    const targetName = displayName(target, target.id);
    const balanceAfter = await getBalance(ownerId, db);

    await recordTransaction(db, {
      userId: ownerId,
      userName: actorName,
      amount: -renamePrice,
      reason: `تغيير اسم ${targetName} إلى ${validation.nickname}`,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      ref: { type: "punishment_rename", targetId: target.id, nickname: validation.nickname },
      targetId: target.id,
      targetName,
      balanceAfter,
    });
    changed.push(`<@${target.id}>`);
  }

  targetMap.delete(ownerId);
  return interaction.reply({ content: `تم تغيير اسم ${changed.join("، ")} إلى **${validation.nickname}**.`, ephemeral: true });
}

async function executeAction(actionKey, interaction, db, ownerId) {
  const data = targetMap.get(ownerId);
  if (!data || data.action !== actionKey || !data.ids?.length) {
    return interaction.reply({ content: "لم يتم اختيار أحد.<:icons8wrong1001:1415979909825695914>", ephemeral: true });
  }

  const targets = [];
  for (const targetId of [...new Set(data.ids)]) {
    const target = await interaction.guild.members.fetch(targetId).catch(() => null);
    if (target && !target.user.bot && target.id !== ownerId) targets.push(target);
  }

  if (!targets.length) {
    return interaction.reply({ content: "لم يتم العثور على أعضاء صالحين.<:icons8wrong1001:1415979909825695914>", ephemeral: true });
  }

  if (actionKey === "rename_action") {
    const manageableTargets = targets.filter((target) => target.manageable);
    if (!manageableTargets.length) {
      return interaction.reply({ content: "لا أستطيع تغيير أسماء الأعضاء المحددين بسبب الصلاحيات أو ترتيب الرتب.", ephemeral: true });
    }
    data.ids = manageableTargets.map((target) => target.id);
    targetMap.set(ownerId, data);
    return interaction.showModal(buildTargetModal(ownerId));
  }

  const price = actions[actionKey].price;
  const totalPrice = price * targets.length;
  const userBalance = await getBalance(ownerId, db);
  if (userBalance < totalPrice) {
    return interaction.reply({ content: `رصيدك غير كافٍ. السعر: ${totalPrice.toLocaleString("en-US")} ريال`, ephemeral: true });
  }

  await subtractBalance(ownerId, totalPrice, db);

  const actorName = displayName(interaction, ownerId);
  const responses = [];

  for (const target of targets) {
    const targetName = displayName(target, target.id);
    let response = "";
    let ref = null;
    let reason = "";

    if (actionKey === "timeout_action") {
      await target.timeout(5 * 60 * 1000).catch(() => {});
      response = `<@${target.id}> تايم أوت 5 دقائق`;
      reason = `تايم أوت 5 دقائق على ${targetName}`;
      ref = { type: "punishment_timeout", targetId: target.id, durationMs: 5 * 60 * 1000 };
    } else if (actionKey === "mute_action") {
      await target.roles.add(muteRoleId).catch(() => {});
      setTimeout(() => target.roles.remove(muteRoleId).catch(() => {}), 5 * 60 * 1000);
      response = `<@${target.id}> كتم 5 دقائق`;
      reason = `كتم 5 دقائق على ${targetName}`;
      ref = { type: "punishment_mute", targetId: target.id, durationMs: 5 * 60 * 1000 };
    } else if (actionKey === "steal_action") {
      const targetBalance = await getBalance(target.id, db);
      const amount = Math.floor(Math.random() * targetBalance);
      if (amount > 0) {
        await subtractBalance(target.id, amount, db);
      }

      response = `<@${target.id}> خصم ${amount.toLocaleString("en-US")} كاش`;
      reason = `تنفيذ خصم عشوائي على ${targetName} (رسوم)`;
      ref = { type: "punishment_steal_fee", targetId: target.id };

      const targetBalanceAfter = await getBalance(target.id, db);
      await recordTransaction(db, {
        userId: target.id,
        userName: targetName,
        amount: -amount,
        reason: `خصم عشوائي بواسطة ${actorName}`,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        ref: { type: "punishment_steal", by: ownerId },
        balanceAfter: targetBalanceAfter,
      });
    }

    const balanceAfter = await getBalance(ownerId, db);
    await recordTransaction(db, {
      userId: ownerId,
      userName: actorName,
      amount: -price,
      reason,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      ref,
      targetId: target.id,
      targetName,
      balanceAfter,
    });
    responses.push(response);
  }

  const reply = await interaction.reply({
    content: `تم تنفيذ العقوبة على ${targets.length} عضو.\n${responses.join("\n")}\nتم خصم ${totalPrice.toLocaleString("en-US")} ريال.`,
  });
  setTimeout(() => reply.delete().catch(() => {}), 5000);
  targetMap.delete(ownerId);
}

module.exports = async function handlePunishments(interaction, db) {
  const id = getShopBaseId(interaction);
  const value = interaction.values?.[0];
  const ownerId = getShopOwnerId(interaction);

  if (id === "shop_nickname_modal_target") {
    return handleRenameModal(interaction, db, ownerId);
  }

  if (id === "shop_target_select" && getShopCustomExtra(interaction)[0] === "punishment") {
    const page = Number(getShopCustomExtra(interaction)[1]) || 0;
    const state = getSelection(ownerId);
    state.ids = mergeSelectionAcrossPages({
      selectedIds: state.ids,
      incomingValues: interaction.values || [],
      members: state.members || [],
      page,
    });
    state.page = page;
    targetMap.set(ownerId, state);
    return renderPunishmentTargetPage(interaction, ownerId, page);
  }

  if ((id === "shop_target_prev" || id === "shop_target_next") && getShopCustomExtra(interaction)[0] === "punishment") {
    const state = getSelection(ownerId);
    const currentPage = Number(getShopCustomExtra(interaction)[1]) || 0;
    const totalPages = Math.max(1, Math.ceil((state.members?.length || 0) / 25));
    const nextPage = Math.min(Math.max(currentPage + (id === "shop_target_next" ? 1 : -1), 0), totalPages - 1);
    return renderPunishmentTargetPage(interaction, ownerId, nextPage);
  }

  if (
    id === "section_punishments" ||
    value === "section_punishments" ||
    (id === "shop_section_select" && value === "section_punishments")
  ) {
    return showPunishmentsMenu(interaction, ownerId);
  }

  if (id === "punishments_menu" && actions[value]) {
    return promptForTarget(interaction, ownerId, value);
  }

  if (id === "confirm_timeout") return executeAction("timeout_action", interaction, db, ownerId);
  if (id === "confirm_mute") return executeAction("mute_action", interaction, db, ownerId);
  if (id === "confirm_steal") return executeAction("steal_action", interaction, db, ownerId);
  if (id === "confirm_rename_member") return executeAction("rename_action", interaction, db, ownerId);
};
