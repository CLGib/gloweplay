/* Glowe Play — shared app data & helpers (real product) */
window.GLOWE = (function () {
  // Badge catalog. Per-child status ('new' | 'progress' | 'earned') is stored
  // in Supabase (child_badges); this is the shared definition of each badge.
  var BADGES = [
    { id:'first-tooth', type:'milestone', emoji:'🦷', a:'First', b:'Tooth', desc:'The day a wobbly tooth finally comes out.', verb:'Captured', how:['Wait for the big wobble','Snap a photo of the gap','Earn your badge'] },
    { id:'first-ride', type:'milestone', emoji:'🚲', a:'First', b:'Ride', desc:'Two wheels, no training wheels — you did it!', verb:'Captured', how:['Take the training wheels off','Film your first real ride','Earn your badge'] },
    { id:'first-day', type:'milestone', emoji:'🎒', a:'First', b:'Day', desc:'The first morning of a brand-new school year.', verb:'Captured', how:['Pack your backpack','Take a first-day photo','Earn your badge'] },
    { id:'grew-up', type:'milestone', emoji:'🧸', a:'Grew', b:'Up', desc:'A little moment that shows how big you got.', verb:'Captured', how:['Notice something new you can do','Add a photo or note','Earn your badge'] },

    { id:'rainbow', type:'adventure', emoji:'🌈', a:'Rainbow', b:'Hunter', desc:'Find a rainbow and chase the colors.', verb:'Completed', how:['Wait for sun after the rain','Photograph the rainbow','Earn your badge'] },
    { id:'baker', type:'adventure', emoji:'🍪', a:'Family', b:'Baker', desc:'Bake something together — flour on the nose required.', verb:'Completed', how:['Pick a recipe together','Bake it (and taste it!)','Earn your badge'] },
    { id:'fort', type:'adventure', emoji:'⛺', a:'Fort', b:'Builder', desc:'Build a blanket fort and camp out inside.', verb:'Completed', how:['Gather blankets & pillows','Build the coziest fort','Earn your badge'] },
    { id:'stargazer', type:'adventure', emoji:'🌠', a:'Star', b:'Gazer', desc:'Look for constellations on a clear, dark night.', verb:'Completed', how:['Wait for a clear night','Spot a constellation','Earn your badge'] },
    { id:'kindness', type:'adventure', emoji:'❤️', a:'Kindness', b:'Hero', desc:'Do something kind, just because.', verb:'Completed', how:['Spot someone who needs a hand','Do a kind thing','Earn your badge'] },

    { id:'birthday', type:'tradition', emoji:'🎂', a:'Birthday', b:'Interview', desc:'The same fun questions, asked every birthday.', verb:'Answered', how:['Sit down on your birthday','Answer the questions','Earn your badge'] },
    { id:'year-review', type:'tradition', emoji:'📅', a:'Year', b:'Review', desc:'Look back at everything this year held.', verb:'Answered', how:['Wait for the end of your year','Answer the look-back','Earn your badge'] },
    { id:'story', type:'tradition', emoji:'🎙️', a:'Story', b:'Time', desc:'Tell a story in your own words and your own voice.', verb:'Answered', how:['Think up a story','Record it in your voice','Earn your badge'] }
  ];

  var TYPE_LABEL = { milestone:'Milestone', adventure:'Adventure', tradition:'Yearly Tradition' };

  var WORDS = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
               'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen'];

  function ageFromBirthdate(bd) {
    if (!bd) return null;
    var d = new Date(bd + 'T00:00:00');
    if (isNaN(d)) return null;
    var now = new Date();
    var age = now.getFullYear() - d.getFullYear();
    var m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
  }
  function numberWord(n) { return (n != null && WORDS[n]) ? WORDS[n] : String(n); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // Build a Supabase client from js/supabase-config.js, or null if unconfigured.
  function makeClient() {
    var cfg = window.GLOWE_SUPABASE || {};
    var ok = cfg.url && cfg.anonKey &&
      cfg.url.indexOf('YOUR_SUPABASE') === -1 && cfg.anonKey.indexOf('YOUR_SUPABASE') === -1;
    if (!ok || !window.supabase) return null;
    return window.supabase.createClient(cfg.url, cfg.anonKey);
  }

  // Load the badge catalog from Supabase (admin-managed), mapped to the shape
  // the product renders. Falls back to the bundled catalog if the table is
  // empty or unreachable, so the app never breaks.
  function loadBadges(client) {
    var fallback = BADGES.map(function (b) {
      return { id: b.id, type: b.type, emoji: b.emoji, a: b.a, b: b.b, desc: b.desc, verb: b.verb, how: b.how, image_url: null };
    });
    if (!client) return Promise.resolve(fallback);
    return client.from('badges').select('*').eq('is_active', true).order('sort_order', { ascending: true })
      .then(function (res) {
        if (res.error || !res.data || !res.data.length) return fallback;
        return res.data.map(function (r) {
          return {
            id: r.id, type: r.type, emoji: r.icon_emoji || '⭐',
            a: r.line1, b: r.line2 || '', desc: r.description || '',
            verb: r.verb || 'Completed',
            how: Array.isArray(r.how_to_earn) ? r.how_to_earn : [],
            image_url: r.image_url || null,
            image_new: r.image_new || null,
            image_progress: r.image_progress || null,
            media: r.media, template: r.template, accent: r.accent
          };
        });
      })
      .catch(function () { return fallback; });
  }

  return {
    BADGES: BADGES, TYPE_LABEL: TYPE_LABEL,
    ageFromBirthdate: ageFromBirthdate, numberWord: numberWord,
    esc: esc, makeClient: makeClient, loadBadges: loadBadges
  };
})();
