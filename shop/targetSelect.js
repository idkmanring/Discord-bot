const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const { makeShopCustomId } = require("./utils");

const TARGET_PAGE_SIZE = 25;

function displayName(member) {
  return (
    member?.displayName ||
    member?.user?.globalName ||
    member?.user?.username ||
    String(member?.id || "عضو")
  );
}

function cleanLabel(value, fallback = "عضو") {
  const text = String(value || fallback)
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text || fallback).slice(0, 90);
}

async function fetchSelectableMembers(interaction, {
  ownerId,
  requiredRoleId = null,
  excludedRoleId = null,
  includeSelf = false,
} = {}) {
  await interaction.guild.members.fetch().catch(() => {});

  return [...interaction.guild.members.cache.values()]
    .filter((member) => {
      if (!member || member.user?.bot) return false;
      if (!includeSelf && member.id === ownerId) return false;
      if (requiredRoleId && !member.roles.cache.has(requiredRoleId)) return false;
      if (excludedRoleId && member.roles.cache.has(excludedRoleId)) return false;
      return true;
    })
    .sort((a, b) => displayName(a).localeCompare(displayName(b), "ar"))
    .map((member) => ({
      id: member.id,
      label: cleanLabel(displayName(member), member.id),
      username: cleanLabel(member.user?.username, member.id),
    }));
}

function getPage(items, page) {
  const totalPages = Math.max(1, Math.ceil(items.length / TARGET_PAGE_SIZE));
  const safePage = Math.min(Math.max(Number(page) || 0, 0), totalPages - 1);
  const start = safePage * TARGET_PAGE_SIZE;
  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + TARGET_PAGE_SIZE),
  };
}

function buildTargetComponents({
  ownerId,
  mode,
  page = 0,
  members = [],
  selectedIds = [],
  confirmId,
  confirmLabel,
  confirmEmoji = "1415979896433278986",
  placeholder = "اختر الأعضاء",
  selectMax = null,
}) {
  const pageInfo = getPage(members, page);
  const pageItems = pageInfo.items;
  const options = pageItems.length
    ? pageItems.map((member) => ({
      label: member.label,
      description: `@${member.username} • ${member.id}`.slice(0, 100),
      value: member.id,
      default: selectedIds.includes(member.id),
    }))
    : [{ label: "لا يوجد أعضاء", description: "لا توجد خيارات متاحة", value: "none" }];

  const maxValues = Math.min(
    25,
    options.length,
    selectMax ? Math.max(1, selectMax) : options.length
  );

  const select = new StringSelectMenuBuilder()
    .setCustomId(makeShopCustomId("shop_target_select", ownerId, mode, pageInfo.page))
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(maxValues)
    .addOptions(options);

  const selectRow = new ActionRowBuilder().addComponents(select);
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(makeShopCustomId("shop_back", ownerId))
      .setLabel(" العودة")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407426312603439226"),
    new ButtonBuilder()
      .setCustomId(makeShopCustomId("shop_target_prev", ownerId, mode, pageInfo.page))
      .setLabel("السابق")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageInfo.page <= 0),
    new ButtonBuilder()
      .setCustomId(makeShopCustomId("shop_target_next", ownerId, mode, pageInfo.page))
      .setLabel("التالي")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageInfo.page >= pageInfo.totalPages - 1),
    new ButtonBuilder()
      .setCustomId(makeShopCustomId(confirmId, ownerId))
      .setLabel(confirmLabel)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(confirmEmoji)
  );

  return [selectRow, buttons];
}

function mergeSelectionAcrossPages({ selectedIds = [], incomingValues = [], members = [], page = 0 }) {
  const incoming = incomingValues.filter((value) => value !== "none");
  const currentPageIds = new Set(getPage(members, page).items.map((member) => member.id));
  const kept = selectedIds.filter((id) => !currentPageIds.has(id));
  return [...new Set([...kept, ...incoming])];
}

module.exports = {
  TARGET_PAGE_SIZE,
  buildTargetComponents,
  fetchSelectableMembers,
  mergeSelectionAcrossPages,
};
