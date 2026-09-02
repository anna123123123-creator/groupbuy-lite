(function (global) {
  'use strict';
  var STORAGE_KEY = 'groupbuy_lite_data_v1';

  var HOUR = 3600 * 1000;
  var DAY = 24 * HOUR;

  function seed() {
    var now = Date.now();
    return {
      products: [
        { id: 'pr1', name: '阳光土鸡蛋', groupPrice: 29.9, originalPrice: 45, unit: '30枚/箱', coverEmoji: '🥚' },
        { id: 'pr2', name: '新疆红富士苹果', groupPrice: 39.9, originalPrice: 68, unit: '10斤装', coverEmoji: '🍎' },
        { id: 'pr3', name: '精选带皮五花肉', groupPrice: 45, originalPrice: 62, unit: '1kg装', coverEmoji: '🥩' },
        { id: 'pr4', name: '农家土蜂蜜', groupPrice: 68, originalPrice: 128, unit: '500g瓶装', coverEmoji: '🍯' },
        { id: 'pr5', name: '有机小番茄', groupPrice: 19.9, originalPrice: 32, unit: '3斤装', coverEmoji: '🍅' },
      ],
      campaigns: [
        {
          id: 'c1', productId: 'pr1', pickupPointName: '阳光花园北门自提点', leaderName: '王姐',
          targetCount: 20, deadline: new Date(now + 2 * DAY).toISOString(), status: 'open',
        },
        {
          id: 'c2', productId: 'pr2', pickupPointName: '翠竹苑东门便利店', leaderName: '李哥',
          targetCount: 6, deadline: new Date(now + 1 * DAY).toISOString(), status: 'open',
        },
        {
          id: 'c3', productId: 'pr3', pickupPointName: '金色年华小区门口', leaderName: '赵姐',
          targetCount: 4, deadline: new Date(now - 3 * DAY).toISOString(), status: 'open',
        },
        {
          id: 'c4', productId: 'pr4', pickupPointName: '阳光花园北门自提点', leaderName: '王姐',
          targetCount: 25, deadline: new Date(now - 1 * DAY).toISOString(), status: 'open',
        },
        {
          id: 'c5', productId: 'pr5', pickupPointName: '翠竹苑东门便利店', leaderName: '孙姐',
          targetCount: 30, deadline: new Date(now + 5 * HOUR).toISOString(), status: 'open',
        },
        {
          id: 'c6', productId: 'pr1', pickupPointName: '金色年华小区门口', leaderName: '赵姐',
          targetCount: 12, deadline: new Date(now + 3 * DAY).toISOString(), status: 'open',
        },
      ],
      participations: [
        { id: 'pt1', campaignId: 'c1', customerName: '张阿姨', phone: '138****2211', qty: 2, joinedAt: new Date(now - 2 * HOUR).toISOString() },
        { id: 'pt2', campaignId: 'c1', customerName: '刘先生', phone: '139****5567', qty: 1, joinedAt: new Date(now - 1 * DAY).toISOString() },
        { id: 'pt3', campaignId: 'c1', customerName: '陈女士', phone: '137****8890', qty: 3, joinedAt: new Date(now - 5 * HOUR).toISOString() },

        { id: 'pt4', campaignId: 'c2', customerName: '黄先生', phone: '135****1123', qty: 1, joinedAt: new Date(now - 6 * HOUR).toISOString() },
        { id: 'pt5', campaignId: 'c2', customerName: '周女士', phone: '136****4432', qty: 2, joinedAt: new Date(now - 4 * HOUR).toISOString() },
        { id: 'pt6', campaignId: 'c2', customerName: '许先生', phone: '150****7723', qty: 1, joinedAt: new Date(now - 3 * HOUR).toISOString() },
        { id: 'pt7', campaignId: 'c2', customerName: '韩女士', phone: '158****3391', qty: 1, joinedAt: new Date(now - 1 * HOUR).toISOString() },

        { id: 'pt8', campaignId: 'c3', customerName: '吴先生', phone: '133****7761', qty: 2, joinedAt: new Date(now - 4 * DAY).toISOString() },
        { id: 'pt9', campaignId: 'c3', customerName: '郑女士', phone: '150****2290', qty: 1, joinedAt: new Date(now - 4 * DAY).toISOString() },
        { id: 'pt10', campaignId: 'c3', customerName: '冯先生', phone: '158****3345', qty: 3, joinedAt: new Date(now - 3.5 * DAY).toISOString() },
        { id: 'pt11', campaignId: 'c3', customerName: '蒋女士', phone: '159****9981', qty: 1, joinedAt: new Date(now - 3.2 * DAY).toISOString() },
        { id: 'pt12', campaignId: 'c3', customerName: '韦先生', phone: '136****5521', qty: 2, joinedAt: new Date(now - 3.1 * DAY).toISOString() },

        { id: 'pt13', campaignId: 'c4', customerName: '许女士', phone: '151****6612', qty: 1, joinedAt: new Date(now - 2 * DAY).toISOString() },
        { id: 'pt14', campaignId: 'c4', customerName: '秦先生', phone: '189****4471', qty: 2, joinedAt: new Date(now - 1.5 * DAY).toISOString() },
        { id: 'pt15', campaignId: 'c4', customerName: '田女士', phone: '177****8823', qty: 1, joinedAt: new Date(now - 1.2 * DAY).toISOString() },

        { id: 'pt16', campaignId: 'c5', customerName: '石先生', phone: '186****2201', qty: 4, joinedAt: new Date(now - 2 * HOUR).toISOString() },
        { id: 'pt17', campaignId: 'c5', customerName: '龙女士', phone: '187****9932', qty: 2, joinedAt: new Date(now - 1 * HOUR).toISOString() },
      ],
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        var s = seed();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        return s;
      }
      return JSON.parse(raw);
    } catch (e) {
      return seed();
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Count of participation rows (people) that joined a campaign — this is what
  // is compared against targetCount to decide whether the group succeeds.
  function participantCount(data, campaignId) {
    return data.participations.filter(function (p) { return p.campaignId === campaignId; }).length;
  }

  // Status is ALWAYS derived from current time + participant count, never
  // trusted from the stored `status` field alone — so it stays correct as
  // time passes (or as new participants join) without any admin action.
  // A campaign succeeds the moment enough participants join, even before
  // its deadline; it only fails once the deadline passes without reaching
  // the target.
  function computeStatus(campaign, count) {
    if (count >= campaign.targetCount) return 'succeeded';
    var deadlinePassed = Date.now() >= new Date(campaign.deadline).getTime();
    return deadlinePassed ? 'failed' : 'open';
  }

  function statusLabel(s) {
    return { open: '拼团中', succeeded: '已成团', failed: '未成团' }[s] || s;
  }

  function remainingLabel(deadline) {
    var diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return '已结束';
    var days = Math.floor(diff / DAY);
    var hours = Math.floor((diff % DAY) / HOUR);
    var mins = Math.floor((diff % HOUR) / 60000);
    if (days > 0) return '剩余 ' + days + '天' + hours + '小时';
    if (hours > 0) return '剩余 ' + hours + '小时' + mins + '分钟';
    return '剩余 ' + mins + '分钟';
  }

  // Real conditional sum: only participations belonging to campaigns whose
  // CURRENT computed status is 'succeeded' count toward confirmed sales.
  function totalConfirmedSales(data) {
    var sum = 0;
    data.campaigns.forEach(function (c) {
      var count = participantCount(data, c.id);
      var status = computeStatus(c, count);
      if (status !== 'succeeded') return;
      var product = data.products.find(function (p) { return p.id === c.productId; });
      if (!product) return;
      data.participations.filter(function (p) { return p.campaignId === c.id; }).forEach(function (p) {
        sum += product.groupPrice * p.qty;
      });
    });
    return Math.round(sum * 100) / 100;
  }

  global.GroupBuyData = {
    load: load,
    save: save,
    uid: uid,
    participantCount: participantCount,
    computeStatus: computeStatus,
    statusLabel: statusLabel,
    remainingLabel: remainingLabel,
    totalConfirmedSales: totalConfirmedSales,
    reset: function () { var s = seed(); save(s); return s; },
  };
})(window);
