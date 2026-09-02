(function () {
  'use strict';

  var data = GroupBuyData.load();

  var sideLinks = document.querySelectorAll('.side-link[data-view]');
  var views = document.querySelectorAll('.admin-view');

  function switchView(name) {
    sideLinks.forEach(function (l) { l.classList.toggle('active', l.dataset.view === name); });
    views.forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + name); });
    if (name === 'dashboard') renderDashboard();
    if (name === 'products') renderProducts();
    if (name === 'campaigns') renderCampaigns();
  }

  sideLinks.forEach(function (l) {
    l.addEventListener('click', function () { switchView(l.dataset.view); });
  });

  document.getElementById('btnResetData').addEventListener('click', function () {
    if (!confirm('确定要重置成示例数据吗？这会清空你新增/修改的所有内容。')) return;
    data = GroupBuyData.reset();
    switchView('dashboard');
  });

  function productName(id) {
    var p = data.products.find(function (x) { return x.id === id; });
    return p ? p.name : '（已删除商品）';
  }

  function product(id) {
    return data.products.find(function (x) { return x.id === id; });
  }

  function campaignStatus(c) {
    var count = GroupBuyData.participantCount(data, c.id);
    return { status: GroupBuyData.computeStatus(c, count), count: count };
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    data = GroupBuyData.load();
    var totalCampaigns = data.campaigns.length;
    var openCount = 0, succeededCount = 0;
    data.campaigns.forEach(function (c) {
      var s = campaignStatus(c).status;
      if (s === 'open') openCount++;
      if (s === 'succeeded') succeededCount++;
    });
    var totalSales = GroupBuyData.totalConfirmedSales(data);

    var stats = [
      { label: '团购活动总数', value: totalCampaigns },
      { label: '拼团中活动数', value: openCount },
      { label: '已成团活动数', value: succeededCount },
      { label: '已成交总金额', value: '¥' + totalSales.toFixed(2) },
    ];
    document.getElementById('statGrid').innerHTML = stats.map(function (s) {
      return '<div class="stat-card"><div class="num">' + s.value + '</div><div class="label">' + s.label + '</div></div>';
    }).join('');

    var recent = data.campaigns.slice().sort(function (a, b) {
      return new Date(b.deadline) - new Date(a.deadline);
    }).slice(0, 6);
    document.getElementById('recentCampaignsBody').innerHTML = recent.map(function (c) {
      var st = campaignStatus(c);
      var p = product(c.productId);
      return '<tr><td>' + (p ? p.coverEmoji : '') + ' ' + productName(c.productId) + '</td>' +
        '<td>' + c.pickupPointName + ' · ' + c.leaderName + '</td>' +
        '<td>' + st.count + ' / ' + c.targetCount + '</td>' +
        '<td><span class="badge ' + st.status + '">' + GroupBuyData.statusLabel(st.status) + '</span></td></tr>';
    }).join('') || '<tr><td colspan="4" style="color:var(--muted)">暂无团购活动</td></tr>';
  }

  // ---------- Products ----------
  var productModalBackdrop = document.getElementById('productModalBackdrop');
  var productModalTitle = document.getElementById('productModalTitle');
  var productModalMsg = document.getElementById('productModalMsg');
  var productForm = document.getElementById('productForm');
  var productIdInput = document.getElementById('productIdInput');
  var productNameInput = document.getElementById('productNameInput');
  var productGroupPriceInput = document.getElementById('productGroupPriceInput');
  var productOriginalPriceInput = document.getElementById('productOriginalPriceInput');
  var productUnitInput = document.getElementById('productUnitInput');
  var productEmojiInput = document.getElementById('productEmojiInput');

  function renderProducts() {
    document.getElementById('productsBody').innerHTML = data.products.map(function (p) {
      return '<tr><td>' + p.coverEmoji + ' ' + p.name + '</td><td>¥' + p.groupPrice + '</td><td>¥' + p.originalPrice + '</td><td>' + p.unit + '</td>' +
        '<td class="table-actions">' +
        '<button class="btn btn-sm" data-edit-product="' + p.id + '">编辑</button>' +
        '<button class="btn btn-sm btn-danger" data-delete-product="' + p.id + '">删除</button>' +
        '</td></tr>';
    }).join('') || '<tr><td colspan="5" style="color:var(--muted)">暂无商品</td></tr>';

    document.querySelectorAll('[data-edit-product]').forEach(function (btn) {
      btn.addEventListener('click', function () { openProductModal(btn.dataset.editProduct); });
    });
    document.querySelectorAll('[data-delete-product]').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteProduct(btn.dataset.deleteProduct); });
    });
  }

  function openProductModal(id) {
    productModalMsg.innerHTML = '';
    productForm.reset();
    if (id) {
      var p = data.products.find(function (x) { return x.id === id; });
      productModalTitle.textContent = '编辑商品';
      productIdInput.value = p.id;
      productNameInput.value = p.name;
      productGroupPriceInput.value = p.groupPrice;
      productOriginalPriceInput.value = p.originalPrice;
      productUnitInput.value = p.unit;
      productEmojiInput.value = p.coverEmoji;
    } else {
      productModalTitle.textContent = '新增商品';
      productIdInput.value = '';
      productEmojiInput.value = '🛒';
    }
    productModalBackdrop.classList.add('show');
  }

  document.getElementById('btnAddProduct').addEventListener('click', function () { openProductModal(null); });
  document.getElementById('btnCloseProductModal').addEventListener('click', function () { productModalBackdrop.classList.remove('show'); });
  productModalBackdrop.addEventListener('click', function (e) { if (e.target === productModalBackdrop) productModalBackdrop.classList.remove('show'); });

  productForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = productNameInput.value.trim();
    var groupPrice = parseFloat(productGroupPriceInput.value);
    var originalPrice = parseFloat(productOriginalPriceInput.value);
    var unit = productUnitInput.value.trim();
    var emoji = productEmojiInput.value.trim() || '🛒';

    if (!name || !unit || !(groupPrice > 0) || !(originalPrice > 0)) {
      productModalMsg.innerHTML = '<div class="msg error">请完整填写所有必填项，价格需大于 0。</div>';
      return;
    }
    if (groupPrice >= originalPrice) {
      productModalMsg.innerHTML = '<div class="msg error">团购价应低于原价，否则拼团没有优惠意义。</div>';
      return;
    }

    var id = productIdInput.value;
    if (id) {
      var p = data.products.find(function (x) { return x.id === id; });
      p.name = name; p.groupPrice = groupPrice; p.originalPrice = originalPrice; p.unit = unit; p.coverEmoji = emoji;
    } else {
      data.products.push({ id: GroupBuyData.uid('pr'), name: name, groupPrice: groupPrice, originalPrice: originalPrice, unit: unit, coverEmoji: emoji });
    }
    GroupBuyData.save(data);
    productModalBackdrop.classList.remove('show');
    renderProducts();
  });

  function deleteProduct(id) {
    if (!confirm('确定删除这个商品吗？关联的团购活动会保留但会显示"已删除商品"。')) return;
    data.products = data.products.filter(function (p) { return p.id !== id; });
    GroupBuyData.save(data);
    renderProducts();
  }

  // ---------- Campaigns ----------
  var campaignModalBackdrop = document.getElementById('campaignModalBackdrop');
  var campaignModalTitle = document.getElementById('campaignModalTitle');
  var campaignModalMsg = document.getElementById('campaignModalMsg');
  var campaignForm = document.getElementById('campaignForm');
  var campaignIdInput = document.getElementById('campaignIdInput');
  var campaignProductInput = document.getElementById('campaignProductInput');
  var campaignPickupInput = document.getElementById('campaignPickupInput');
  var campaignLeaderInput = document.getElementById('campaignLeaderInput');
  var campaignTargetInput = document.getElementById('campaignTargetInput');
  var campaignDeadlineInput = document.getElementById('campaignDeadlineInput');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function toLocalInputValue(isoString) {
    var d = new Date(isoString);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fromLocalInputValue(value) {
    // value is "YYYY-MM-DDTHH:mm" in the browser's local time.
    return new Date(value).toISOString();
  }

  function renderCampaigns() {
    document.getElementById('campaignsBody').innerHTML = data.campaigns.map(function (c) {
      var st = campaignStatus(c);
      var p = product(c.productId);
      return '<tr><td>' + (p ? p.coverEmoji + ' ' : '') + productName(c.productId) + '</td><td>' + c.pickupPointName + '</td><td>' + c.leaderName + '</td>' +
        '<td>' + st.count + ' / ' + c.targetCount + '</td>' +
        '<td>' + toLocalInputValue(c.deadline).replace('T', ' ') + '</td>' +
        '<td><span class="badge ' + st.status + '">' + GroupBuyData.statusLabel(st.status) + '</span></td>' +
        '<td class="table-actions">' +
        '<button class="btn btn-sm" data-view-participants="' + c.id + '">参团人</button>' +
        '<button class="btn btn-sm" data-edit-campaign="' + c.id + '">编辑</button>' +
        '<button class="btn btn-sm btn-danger" data-delete-campaign="' + c.id + '">删除</button>' +
        '</td></tr>';
    }).join('') || '<tr><td colspan="7" style="color:var(--muted)">暂无团购活动</td></tr>';

    document.querySelectorAll('[data-edit-campaign]').forEach(function (btn) {
      btn.addEventListener('click', function () { openCampaignModal(btn.dataset.editCampaign); });
    });
    document.querySelectorAll('[data-delete-campaign]').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteCampaign(btn.dataset.deleteCampaign); });
    });
    document.querySelectorAll('[data-view-participants]').forEach(function (btn) {
      btn.addEventListener('click', function () { openParticipantsModal(btn.dataset.viewParticipants); });
    });
  }

  function fillProductSelect() {
    campaignProductInput.innerHTML = data.products.map(function (p) {
      return '<option value="' + p.id + '">' + p.coverEmoji + ' ' + p.name + '</option>';
    }).join('');
  }

  function openCampaignModal(id) {
    campaignModalMsg.innerHTML = '';
    campaignForm.reset();
    fillProductSelect();
    if (id) {
      var c = data.campaigns.find(function (x) { return x.id === id; });
      campaignModalTitle.textContent = '编辑团购活动';
      campaignIdInput.value = c.id;
      campaignProductInput.value = c.productId;
      campaignPickupInput.value = c.pickupPointName;
      campaignLeaderInput.value = c.leaderName;
      campaignTargetInput.value = c.targetCount;
      campaignDeadlineInput.value = toLocalInputValue(c.deadline);
    } else {
      campaignModalTitle.textContent = '新增团购活动';
      campaignIdInput.value = '';
      var defaultDeadline = new Date(Date.now() + 3 * 24 * 3600 * 1000);
      campaignDeadlineInput.value = toLocalInputValue(defaultDeadline.toISOString());
    }
    campaignModalBackdrop.classList.add('show');
  }

  document.getElementById('btnAddCampaign').addEventListener('click', function () {
    if (!data.products.length) {
      alert('请先在"商品管理"里添加至少一个商品，再创建团购活动。');
      return;
    }
    openCampaignModal(null);
  });
  document.getElementById('btnCloseCampaignModal').addEventListener('click', function () { campaignModalBackdrop.classList.remove('show'); });
  campaignModalBackdrop.addEventListener('click', function (e) { if (e.target === campaignModalBackdrop) campaignModalBackdrop.classList.remove('show'); });

  campaignForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var productId = campaignProductInput.value;
    var pickup = campaignPickupInput.value.trim();
    var leader = campaignLeaderInput.value.trim();
    var target = parseInt(campaignTargetInput.value, 10);
    var deadlineValue = campaignDeadlineInput.value;

    if (!productId || !pickup || !leader || !deadlineValue || !(target > 0)) {
      campaignModalMsg.innerHTML = '<div class="msg error">请完整填写所有必填项，目标人数需大于 0。</div>';
      return;
    }

    var deadlineIso = fromLocalInputValue(deadlineValue);
    var id = campaignIdInput.value;
    if (id) {
      var c = data.campaigns.find(function (x) { return x.id === id; });
      c.productId = productId; c.pickupPointName = pickup; c.leaderName = leader; c.targetCount = target; c.deadline = deadlineIso;
    } else {
      data.campaigns.push({
        id: GroupBuyData.uid('c'), productId: productId, pickupPointName: pickup, leaderName: leader,
        targetCount: target, deadline: deadlineIso, status: 'open',
      });
    }
    GroupBuyData.save(data);
    campaignModalBackdrop.classList.remove('show');
    renderCampaigns();
  });

  function deleteCampaign(id) {
    if (!confirm('确定删除这个团购活动吗？关联的参团记录也会一并删除。')) return;
    data.campaigns = data.campaigns.filter(function (c) { return c.id !== id; });
    data.participations = data.participations.filter(function (p) { return p.campaignId !== id; });
    GroupBuyData.save(data);
    renderCampaigns();
  }

  // ---------- Participants ----------
  var participantsModalBackdrop = document.getElementById('participantsModalBackdrop');
  var participantsModalTitle = document.getElementById('participantsModalTitle');
  var participantsModalSub = document.getElementById('participantsModalSub');
  var participantsBody = document.getElementById('participantsBody');

  function openParticipantsModal(campaignId) {
    var c = data.campaigns.find(function (x) { return x.id === campaignId; });
    if (!c) return;
    var st = campaignStatus(c);
    participantsModalTitle.textContent = productName(c.productId) + ' · 参团人名单';
    participantsModalSub.textContent = c.pickupPointName + ' · 团长 ' + c.leaderName + ' · ' + st.count + ' / ' + c.targetCount + ' 人 · ' + GroupBuyData.statusLabel(st.status);

    var list = data.participations.filter(function (p) { return p.campaignId === campaignId; })
      .slice().sort(function (a, b) { return new Date(b.joinedAt) - new Date(a.joinedAt); });
    participantsBody.innerHTML = list.map(function (p) {
      return '<tr><td>' + p.customerName + '</td><td>' + p.phone + '</td><td>' + p.qty + '</td><td>' + toLocalInputValue(p.joinedAt).replace('T', ' ') + '</td></tr>';
    }).join('') || '<tr><td colspan="4" style="color:var(--muted)">暂无参团记录</td></tr>';

    participantsModalBackdrop.classList.add('show');
  }

  document.getElementById('btnCloseParticipantsModal').addEventListener('click', function () { participantsModalBackdrop.classList.remove('show'); });
  participantsModalBackdrop.addEventListener('click', function (e) { if (e.target === participantsModalBackdrop) participantsModalBackdrop.classList.remove('show'); });

  switchView('dashboard');
})();
