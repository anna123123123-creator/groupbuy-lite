(function () {
  'use strict';

  var campaignGrid = document.getElementById('campaignGrid');
  var modalBackdrop = document.getElementById('modalBackdrop');
  var btnCloseModal = document.getElementById('btnCloseModal');
  var modalCampaignName = document.getElementById('modalCampaignName');
  var modalCampaignInfo = document.getElementById('modalCampaignInfo');
  var modalMsg = document.getElementById('modalMsg');
  var joinForm = document.getElementById('joinForm');
  var joinCampaignId = document.getElementById('joinCampaignId');
  var customerNameInput = document.getElementById('customerNameInput');
  var phoneInput = document.getElementById('phoneInput');
  var qtyInput = document.getElementById('qtyInput');

  var data = GroupBuyData.load();

  function productOf(id) {
    return data.products.find(function (p) { return p.id === id; });
  }

  function renderGrid() {
    // Re-read from storage each render so the grid always reflects the very
    // latest state (including edits made from another tab/admin session).
    data = GroupBuyData.load();

    var cards = data.campaigns.slice().sort(function (a, b) {
      return new Date(a.deadline) - new Date(b.deadline);
    }).map(function (c) {
      var product = productOf(c.productId);
      if (!product) return '';
      var count = GroupBuyData.participantCount(data, c.id);
      var status = GroupBuyData.computeStatus(c, count);
      var pct = Math.min(100, Math.round((count / c.targetCount) * 100));

      var joinBtn = status === 'open'
        ? '<button class="btn btn-primary btn-block" data-join="' + c.id + '">立即参团</button>'
        : '<button class="btn btn-block" disabled>' + (status === 'succeeded' ? '已成团，无法再参团' : '未成团，已结束') + '</button>';

      return '<div class="campaign-card" data-campaign="' + c.id + '">' +
        '<div class="campaign-card__top">' +
        '<div class="campaign-card__emoji">' + product.coverEmoji + '</div>' +
        '<span class="badge ' + status + '">' + GroupBuyData.statusLabel(status) + '</span>' +
        '</div>' +
        '<h3>' + product.name + '</h3>' +
        '<div class="campaign-card__price"><span class="group-price">¥' + product.groupPrice + '</span> <span class="original-price">¥' + product.originalPrice + '</span> <span class="unit">/ ' + product.unit + '</span></div>' +
        '<div class="campaign-card__meta">📍 ' + c.pickupPointName + ' · 团长 ' + c.leaderName + '</div>' +
        '<div class="progress-bar"><div class="progress-bar__fill" style="width:' + pct + '%"></div></div>' +
        '<div class="campaign-card__stats"><span>' + count + ' / ' + c.targetCount + ' 人已参团</span><span>' + GroupBuyData.remainingLabel(c.deadline) + '</span></div>' +
        joinBtn +
        '</div>';
    }).join('');

    campaignGrid.innerHTML = cards || '<p style="color:var(--muted)">暂无拼团活动</p>';

    campaignGrid.querySelectorAll('[data-join]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(btn.dataset.join);
      });
    });
  }

  var currentCampaignId = null;

  function openModal(campaignId) {
    // Re-read fresh data at the moment the modal opens too.
    data = GroupBuyData.load();
    var c = data.campaigns.find(function (x) { return x.id === campaignId; });
    if (!c) return;
    var product = productOf(c.productId);
    var count = GroupBuyData.participantCount(data, c.id);
    var status = GroupBuyData.computeStatus(c, count);
    if (status !== 'open') {
      renderGrid();
      return;
    }

    currentCampaignId = campaignId;
    joinCampaignId.value = campaignId;
    modalCampaignName.textContent = product.name;
    modalCampaignInfo.textContent = c.pickupPointName + ' · 团长 ' + c.leaderName + ' · 团购价 ¥' + product.groupPrice + '/' + product.unit + ' · 目前 ' + count + '/' + c.targetCount + ' 人';

    modalMsg.innerHTML = '';
    joinForm.reset();
    qtyInput.value = 1;
    modalBackdrop.classList.add('show');
  }

  function closeModal() {
    modalBackdrop.classList.remove('show');
    currentCampaignId = null;
  }

  btnCloseModal.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', function (e) {
    if (e.target === modalBackdrop) closeModal();
  });

  joinForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var campaignId = joinCampaignId.value;
    if (!campaignId) return;

    var name = customerNameInput.value.trim();
    var phone = phoneInput.value.trim();
    var qty = parseInt(qtyInput.value, 10);

    if (!name) return showMsg('请填写姓名。', true);
    if (!phone) return showMsg('请填写手机号。', true);
    if (!(qty > 0)) return showMsg('数量必须大于 0。', true);

    // IMPORTANT: re-read fresh data and re-derive status right before writing.
    // The form may have been open for a while (deadline could have passed,
    // or an admin could have changed/deleted the campaign in another tab) —
    // never trust the state the modal was opened with.
    var freshData = GroupBuyData.load();
    var c = freshData.campaigns.find(function (x) { return x.id === campaignId; });
    if (!c) return showMsg('该拼团活动已不存在。', true);
    var count = GroupBuyData.participantCount(freshData, c.id);
    var status = GroupBuyData.computeStatus(c, count);
    if (status !== 'open') {
      return showMsg('参团失败：该活动已' + (status === 'succeeded' ? '成团' : '结束（未成团）') + '，无法再参团。', true);
    }

    var participation = {
      id: GroupBuyData.uid('pt'),
      campaignId: campaignId,
      customerName: name,
      phone: phone,
      qty: qty,
      joinedAt: new Date().toISOString(),
    };
    freshData.participations.push(participation);
    GroupBuyData.save(freshData);
    data = freshData;

    showMsg('参团成功！已为你锁定 ' + qty + ' 份，请留意团长通知自提时间。', false);
    joinForm.reset();
    qtyInput.value = 1;
    renderGrid();

    var newCount = GroupBuyData.participantCount(freshData, c.id);
    var newStatus = GroupBuyData.computeStatus(c, newCount);
    joinCampaignId.value = newStatus === 'open' ? campaignId : '';
    var product = productOf(c.productId);
    modalCampaignInfo.textContent = c.pickupPointName + ' · 团长 ' + c.leaderName + ' · 团购价 ¥' + product.groupPrice + '/' + product.unit + ' · 目前 ' + newCount + '/' + c.targetCount + ' 人';
  });

  function showMsg(text, isError) {
    modalMsg.innerHTML = '<div class="msg ' + (isError ? 'error' : 'success') + '">' + text + '</div>';
  }

  renderGrid();
})();
