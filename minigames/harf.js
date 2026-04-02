// أضف هذه الدالة فوق الـ module.exports
async function startHarfFromMenu(interaction) {
  await interaction.deferUpdate().catch(() => {});
  startHarfGame(interaction.channel.id);
  await showHarfLobby(interaction.channel);
}

// دالة شاملة لزر التصويت والأزرار العادية الخاصة بحرف لتنظيف الاندكس
async function handleAllHarfButtons(i) {
  try {
    if (i.customId.startsWith("harf_vote_")) {
      await handleVote(i);
      if (!i.deferred && !i.replied) await i.deferUpdate().catch(() => {});
      return;
    }
    await handleHarfLobbyInteraction(i);
    await handleHarfInteraction(i);
  } catch (e) {
    console.error("harf handler:", e);
  } finally {
    if (!i.deferred && !i.replied) await i.deferUpdate().catch(() => {});
  }
}

module.exports = {
  startHarfGame,
  showHarfLobby,
  handleHarfLobbyInteraction,
  handleHarfInteraction,
  handleVote,
  startHarfFromMenu,      // الدالة الجديدة للقائمة المنسدلة
  handleAllHarfButtons    // مجمع تفاعلات حرف
};