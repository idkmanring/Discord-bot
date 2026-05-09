// 📁 /shop/jail.js
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// استدعِ recordTransaction من utils مع الدوال الحالية
const { getBalance, subtractBalance, recordTransaction } = require("./utils");
const { getShopBaseId, getShopCustomExtra, getShopOwnerId, makeShopCustomId } = require("./utils");
const {
  buildTargetComponents,
  fetchSelectableMembers,
  mergeSelectionAcrossPages,
} = require("./targetSelect");

const jailRoleId = "1393698313710207038";
const visitorRoleId = "1393698552122835104";
const jailPrice = 5000;
const bailPrice = 10000;
const visitPrice = 2500;
const boosterRoleId = "1360742955735974030"; // 🎖️ استثناء البوستر

const jailTargetMap = new Map();
const bailTargetMap = new Map();

function getSelection(map, ownerId) {
  return map.get(ownerId) || { selectedIds: [], members: [], page: 0 };
}

async function showJailTargetSelect(interaction, ownerId, mode, page = 0) {
  const isBail = mode === "bail";
  const members = await fetchSelectableMembers(interaction, {
    ownerId,
    requiredRoleId: isBail ? jailRoleId : null,
    excludedRoleId: isBail ? null : jailRoleId,
  });

  const map = isBail ? bailTargetMap : jailTargetMap;
  const current = getSelection(map, ownerId);
  const state = { ...current, members, page };
  map.set(ownerId, state);

  const components = buildTargetComponents({
    ownerId,
    mode,
    page,
    members,
    selectedIds: state.selectedIds,
    confirmId: isBail ? "confirm_mention_bail" : "confirm_mention_jail",
    confirmLabel: isBail ? " تأكيد الكفالة" : " تأكيد السجن",
    placeholder: isBail ? "اختر المساجين للكفالة" : "اختر المواطنين للسجن",
  });

  return interaction.update({
    files: [isBail ? "./assets/templates/Bail.png" : "./assets/templates/Jail.png"],
    components,
    embeds: [],
    content: "",
  });
}

module.exports = async function handleJail(interaction, db) {
  const ownerId = getShopOwnerId(interaction);
  const userId = ownerId;
  const guild = interaction.guild;
  const id = getShopBaseId(interaction);
  const value = interaction.values?.[0];
  const extra = getShopCustomExtra(interaction);

  if (id === "shop_target_select" && ["jail", "bail"].includes(extra[0])) {
    const mode = extra[0];
    const page = Number(extra[1]) || 0;
    const map = mode === "bail" ? bailTargetMap : jailTargetMap;
    const state = getSelection(map, ownerId);
    state.page = page;
    state.selectedIds = mergeSelectionAcrossPages({
      selectedIds: state.selectedIds,
      incomingValues: interaction.values || [],
      members: state.members,
      page,
    });
    map.set(ownerId, state);
    return showJailTargetSelect(interaction, ownerId, mode, page);
  }

  if ((id === "shop_target_prev" || id === "shop_target_next") && ["jail", "bail"].includes(extra[0])) {
    const mode = extra[0];
    const currentPage = Number(extra[1]) || 0;
    const map = mode === "bail" ? bailTargetMap : jailTargetMap;
    const state = getSelection(map, ownerId);
    const totalPages = Math.max(1, Math.ceil((state.members?.length || 0) / 25));
    const nextPage = Math.min(Math.max(currentPage + (id === "shop_target_next" ? 1 : -1), 0), totalPages - 1);
    return showJailTargetSelect(interaction, ownerId, mode, nextPage);
  }

  // ✅ قسم السجن
  if (
    id === "section_jail" ||
    value === "section_jail" ||
    (id === "shop_section_select" && value === "section_jail")
  ) {
    const jailMenu = new StringSelectMenuBuilder()
      .setCustomId(makeShopCustomId("jail_menu", ownerId))
      .setPlaceholder("اختر نوع الإجراء")
      .addOptions([
        { label: " سجن مواطن", value: "jail_action", description: `السعر: ${jailPrice.toLocaleString("en-US")} ريال`, emoji: { id: "1409306733897318410", animated: false } },
        { label: " كفالة مواطن", value: "bail_action", description: `السعر: ${bailPrice.toLocaleString("en-US")} ريال`, emoji: { id: "1409319250711154728", animated: false } },
        { label: " زيارة سجين", value: "visit_action", description: `السعر: ${visitPrice.toLocaleString("en-US")} ريال`, emoji: { id: "1409319242217558096", animated: false } },
      ]);

    const row = new ActionRowBuilder().addComponents(jailMenu);
    const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(makeShopCustomId("shop_back", ownerId))
        .setLabel(" العودة")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("1407426312603439226")
    );

    return interaction.update({
      files: ["./assets/templates/Prison.png"],
      components: [row, backRow],
      embeds: []
    });
  }

  // ✅ زر العودة
  if (id === "shop_back") {
    return interaction.message.delete().catch(() => {});
  }

  // ✅ سجن مواطن
  if (id === "jail_menu" && value === "jail_action") {
    jailTargetMap.set(ownerId, { selectedIds: [], members: [], page: 0 });
    return showJailTargetSelect(interaction, ownerId, "jail", 0);
  }

  // ✅ تأكيد تنفيذ السجن
  if (id === "confirm_mention_jail") {
    const state = getSelection(jailTargetMap, ownerId);
    const targetIds = [...new Set(state.selectedIds || [])];
    if (!targetIds.length) {
      return interaction.reply({ content: "اختر شخصًا واحدًا على الأقل من القائمة.<:icons8wrong1001:1415979909825695914>", ephemeral: true });
    }

    const targets = [];
    for (const targetId of targetIds) {
      const target = await guild.members.fetch(targetId).catch(() => null);
      if (target && !target.user.bot && target.id !== userId && !target.roles.cache.has(jailRoleId)) targets.push(target);
    }

    if (!targets.length) {
      return interaction.reply({ content: "لا يوجد هدف صالح للسجن من اختيارك.<:icons8wrong1001:1415979909825695914>", ephemeral: true });
    }

    const totalPrice = jailPrice * targets.length;
    const balance = await getBalance(userId, db);
    if (balance < totalPrice) {
      return interaction.reply({ content: ` لا تملك كاش كافي. السعر الإجمالي: <:icons8wrong1001:1415979909825695914> ${totalPrice.toLocaleString("en-US")}`, ephemeral: true });
    }

    await subtractBalance(userId, totalPrice, db);

    const jailedMentions = [];
    // حفظ الأدوار قبل إزالتها (مع استثناءات)
    for (const target of targets) {
      const rolesToRemove = target.roles.cache
        .filter(r => r.id !== guild.id && r.id !== jailRoleId && r.id !== boosterRoleId)
        .map(r => r.id);

      await db.collection("prisoner_users").updateOne(
        { userId: target.id },
        { $set: { userId: target.id, roles: rolesToRemove, jailedAt: new Date(), jailedBy: userId } },
        { upsert: true }
      );

      await target.roles.remove(rolesToRemove).catch(() => {});
      await target.roles.add(jailRoleId).catch(() => {});
      jailedMentions.push(`<@${target.id}>`);

      const actorName =
        interaction.member?.displayName ||
        interaction.user?.globalName ||
        interaction.user?.username ||
        String(userId);
      const targetName =
        target.displayName ||
        target.user?.globalName ||
        target.user?.username ||
        String(target.id);

      const balanceAfter = await getBalance(userId, db);
      await recordTransaction(db, {
        userId,
        userName: actorName,
        amount: -jailPrice,
        reason: `سجن مواطن: ${targetName}`,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        ref: { type: "jail", targetId: target.id },
        targetId: target.id,
        targetName,
        balanceAfter
      });

      setTimeout(async () => {
        const record = await db.collection("prisoner_users").findOne({ userId: target.id });
        if (!record) return;

        const rolesToRestore = record.roles.filter(r => r !== boosterRoleId);
        if (rolesToRestore.length > 0) {
          await target.roles.add(rolesToRestore).catch(() => {});
        }

        await target.roles.remove(jailRoleId).catch(() => {});

        await db.collection("prisoner_users").deleteOne({ userId: target.id });
        await interaction.channel.send({ content: ` انتهت مدة سجن <@${target.id}> وتم إطلاق سراحه. <:icons8timeout100:1409299705371955240>` });
      }, 5 * 60 * 1000);
    }

    await interaction.reply({ content: ` تم سجن ${jailedMentions.join("، ")} لمدة 5 دقائق! <:icons8arrest100:1409306733897318410>\nتم خصم ${totalPrice.toLocaleString("en-US")} ريال.` });

    jailTargetMap.delete(ownerId);
  }

  // ✅ كفالة مواطن
  if (id === "jail_menu" && value === "bail_action") {
    bailTargetMap.set(ownerId, { selectedIds: [], members: [], page: 0 });
    return showJailTargetSelect(interaction, ownerId, "bail", 0);
  }

  // ✅ تنفيذ الكفالة
  if (id === "confirm_mention_bail") {
    const state = getSelection(bailTargetMap, ownerId);
    const targetIds = [...new Set(state.selectedIds || [])];
    if (!targetIds.length) {
      return interaction.reply({ content: "اختر سجينًا واحدًا على الأقل من القائمة.<:icons8wrong1001:1415979909825695914>", ephemeral: true });
    }

    const targets = [];
    for (const targetId of targetIds) {
      const target = await guild.members.fetch(targetId).catch(() => null);
      const record = target ? await db.collection("prisoner_users").findOne({ userId: target.id }) : null;
      if (target && target.roles.cache.has(jailRoleId) && record) targets.push({ target, record });
    }

    if (!targets.length) {
      return interaction.reply({ content: "لا يوجد سجين صالح للكفالة من اختيارك.<:icons8wrong1001:1415979909825695914>", ephemeral: true });
    }

    const totalPrice = bailPrice * targets.length;
    const balance = await getBalance(userId, db);
    if (balance < totalPrice) {
      return interaction.reply({ content: ` لا تملك كاش كافي. السعر الإجمالي: <:icons8wrong1001:1415979909825695914> ${totalPrice.toLocaleString("en-US")}`, ephemeral: true });
    }

    // خصم قيمة الكفالة
    await subtractBalance(userId, totalPrice, db);

    const bailedMentions = [];
    for (const { target, record } of targets) {
      // استرجاع الأدوار
      const rolesToRestore = record.roles.filter(r => r !== boosterRoleId);
      if (rolesToRestore.length > 0) {
        await target.roles.add(rolesToRestore).catch(() => {});
      }

      // إزالة رول السجن
      await target.roles.remove(jailRoleId).catch(() => {});
      await db.collection("prisoner_users").deleteOne({ userId: target.id });
      bailedMentions.push(`<@${target.id}>`);

      // أسماء العرض
      const actorName =
        interaction.member?.displayName ||
        interaction.user?.globalName ||
        interaction.user?.username ||
        String(userId);
      const targetName =
        target.displayName ||
        target.user?.globalName ||
        target.user?.username ||
        String(target.id);

      // تسجيل المعاملة
      const balanceAfter = await getBalance(userId, db);
      await recordTransaction(db, {
        userId,
        userName: actorName,
        amount: -bailPrice,
        reason: `كفالة سجين: ${targetName}`,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        ref: { type: "bail", targetId: target.id },
        targetId: target.id,
        targetName,
        balanceAfter
      });
    }

    await interaction.reply({ content: ` تم كفالة ${bailedMentions.join("، ")} بنجاح! <:icons8bail100:1409319250711154728>\nتم خصم ${totalPrice.toLocaleString("en-US")} ريال.` });

    bailTargetMap.delete(ownerId);
  }

  // ✅ زيارة سجين
  if (id === "jail_menu" && value === "visit_action") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(makeShopCustomId("shop_back", ownerId)).setLabel(" العودة").setStyle(ButtonStyle.Secondary).setEmoji("1407426312603439226"),
      new ButtonBuilder().setCustomId(makeShopCustomId("confirm_visit", ownerId)).setLabel(" تأكيد الزيارة").setStyle(ButtonStyle.Secondary).setEmoji("1415979896433278986")
    );

    await interaction.update({
      files: ["./assets/templates/Visit.png"],
      components: [row],
      embeds: []
    });
  }

  if (id === "confirm_visit") {
    const balance = await getBalance(userId, db);
    if (balance < visitPrice) {
      return interaction.reply({ content: ` لا تملك كاش كافي. السعر: <:icons8wrong1001:1415979909825695914> ${visitPrice}`, ephemeral: true });
    }

    const member = await guild.members.fetch(userId);
    await subtractBalance(userId, visitPrice, db);
    await member.roles.add(visitorRoleId).catch(() => {});
    await interaction.reply({ content: ` تم منحك صلاحية زيارة السجن لمدة 5 دقائق. <:icons8meeting100:1409319242217558096>` });

    // اسم عرض المنفّذ
    const actorName =
      interaction.member?.displayName ||
      interaction.user?.globalName ||
      interaction.user?.username ||
      String(userId);

    // تسجيل المعاملة
    const balanceAfter = await getBalance(userId, db);
    await recordTransaction(db, {
      userId,
      userName: actorName,
      amount: -visitPrice,
      reason: "زيارة سجين",
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      ref: { type: "visit" },
      balanceAfter
    });

    setTimeout(async () => {
      await member.roles.remove(visitorRoleId).catch(() => {});
    }, 5 * 60 * 1000);
  }
};
