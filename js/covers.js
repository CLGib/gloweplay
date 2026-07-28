/* Glowe Play — book cover themes (SVG doodle styles).
   Every theme shares the same title/date/logo/photo structure; they differ in
   background, palette, and the scattered SVG doodles. */
window.GLOWE_COVERS = (function () {
  var SHAPES = {
    star:  '<path d="M12 1.5l2.9 6.4 7 .6-5.3 4.6 1.6 6.8L12 16.9 5.8 20.5l1.6-6.8L2.1 8.5l7-.6z"/>',
    spark: '<path d="M12 0c.9 6.4 4.7 10.2 11 11-6.3.8-10.1 4.6-11 11-.9-6.4-4.7-10.2-11-11 6.3-.8 10.1-4.6 11-11z"/>',
    heart: '<path d="M12 21S3 15 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 15 12 21 12 21z"/>',
    dot:   '<circle cx="12" cy="12" r="7"/>',
    ring:  '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3.2"/>',
    flower:'<g><circle cx="12" cy="6" r="4"/><circle cx="12" cy="18" r="4"/><circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/><circle cx="12" cy="12" r="3.4" fill="#FFF8F0"/></g>',
    leaf:  '<path d="M4 20C4 10 12 4 20 4c0 10-8 16-16 16z"/>',
    moon:  '<path d="M20.5 14.5A9 9 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/>',
    cloud: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 1 1 17 18z"/>',
    wave:  '<path d="M2 14c3-4 6-4 9 0s6 4 9 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
  };
  // Fixed scatter positions (percent of cover), kept away from the center content.
  var POS = [
    { x: 7, y: 9, s: 30, r: -12 }, { x: 88, y: 7, s: 26, r: 14 }, { x: 50, y: 5, s: 16, r: 0 },
    { x: 4, y: 42, s: 20, r: 18 }, { x: 92, y: 40, s: 24, r: -10 }, { x: 9, y: 72, s: 26, r: -16 },
    { x: 90, y: 74, s: 30, r: 12 }, { x: 50, y: 93, s: 16, r: 0 }, { x: 20, y: 22, s: 13, r: 0 },
    { x: 80, y: 24, s: 15, r: 0 }, { x: 14, y: 55, s: 13, r: 0 }, { x: 86, y: 57, s: 13, r: 0 }
  ];
  var THEMES = [
    { id: 'classic', name: 'Classic', bg: 'linear-gradient(165deg,#FDFBF4,#F6F0E2)', ink: '#243B6B', accent: '#F25F5C',
      shapes: ['star','heart','spark','flower','dot','star','heart','dot','spark','flower','dot','star'],
      colors: ['#F4C542','#F25F5C','#4EA8DE','#F4C542','#5CB85C','#243B6B','#F25F5C','#4EA8DE','#F4C542','#5CB85C','#F25F5C','#F4C542'] },
    { id: 'starlight', name: 'Starlight', bg: 'radial-gradient(circle at 50% 18%, #2c3f73, #182543 72%)', ink: '#FFF8F0', accent: '#F4C542',
      shapes: ['star','spark','moon','dot','star','spark','dot','star','spark','dot','star','spark'],
      colors: ['#F4C542','#FCFCFA','#F4C542','#4EA8DE','#FCFCFA','#F4C542','#F4C542','#FCFCFA','#F4C542','#4EA8DE','#F4C542','#FCFCFA'] },
    { id: 'sunshine', name: 'Sunshine', bg: 'linear-gradient(160deg,#FFF3D0,#FCEBC6)', ink: '#243B6B', accent: '#F25F5C',
      shapes: ['spark','dot','ring','star','dot','spark','ring','dot','spark','star','dot','ring'],
      colors: ['#F4C542','#F25F5C','#4EA8DE','#F4C542','#5CB85C','#F25F5C','#F4C542','#4EA8DE','#F25F5C','#F4C542','#5CB85C','#F25F5C'] },
    { id: 'rainbow', name: 'Rainbow', bg: 'linear-gradient(160deg,#FFF8F0,#EAF4FB)', ink: '#243B6B', accent: '#4EA8DE',
      shapes: ['cloud','dot','spark','cloud','dot','star','dot','cloud','spark','dot','star','dot'],
      colors: ['#4EA8DE','#F25F5C','#F4C542','#7FC4E8','#5CB85C','#F4C542','#F25F5C','#9FD0EF','#4EA8DE','#5CB85C','#F4C542','#F25F5C'] },
    { id: 'meadow', name: 'Meadow', bg: 'linear-gradient(160deg,#EAF6E6,#D9EFD2)', ink: '#2F5D33', accent: '#5CB85C',
      shapes: ['flower','leaf','dot','flower','leaf','spark','dot','flower','leaf','dot','flower','leaf'],
      colors: ['#F25F5C','#5CB85C','#F4C542','#F7857F','#4A9E4A','#F4C542','#5CB85C','#F4C542','#5CB85C','#F25F5C','#F7857F','#5CB85C'] },
    { id: 'blossom', name: 'Blossom', bg: 'linear-gradient(160deg,#FDEDEF,#F9DDE6)', ink: '#7A3B52', accent: '#F25F5C',
      shapes: ['flower','heart','dot','flower','heart','spark','dot','flower','heart','dot','flower','heart'],
      colors: ['#F25F5C','#F7857F','#F4C542','#E26A86','#F25F5C','#F4C542','#F7857F','#F25F5C','#F7857F','#F4C542','#E26A86','#F25F5C'] },
    { id: 'ocean', name: 'Ocean', bg: 'linear-gradient(160deg,#E3F2FB,#CDEAF6)', ink: '#1F5A80', accent: '#2E8AC4',
      shapes: ['wave','dot','spark','wave','dot','ring','dot','wave','spark','dot','wave','dot'],
      colors: ['#4EA8DE','#2E8AC4','#F4C542','#7FC4E8','#4EA8DE','#2E8AC4','#5CB85C','#4EA8DE','#F4C542','#2E8AC4','#7FC4E8','#4EA8DE'] },
    { id: 'cosmic', name: 'Cosmic', bg: 'radial-gradient(circle at 50% 22%, #3b2a63, #1c1740 72%)', ink: '#FFF8F0', accent: '#7FC4E8',
      shapes: ['ring','star','spark','dot','star','ring','spark','star','dot','spark','star','ring'],
      colors: ['#F4C542','#FCFCFA','#7FC4E8','#F25F5C','#F4C542','#7FC4E8','#FCFCFA','#F4C542','#7FC4E8','#FCFCFA','#F4C542','#7FC4E8'] },
    { id: 'confetti', name: 'Confetti', bg: 'linear-gradient(160deg,#FFF8F0,#FDEFD6)', ink: '#243B6B', accent: '#F25F5C',
      shapes: ['dot','spark','dot','star','dot','spark','dot','star','dot','spark','dot','star'],
      colors: ['#F25F5C','#4EA8DE','#F4C542','#5CB85C','#F25F5C','#4EA8DE','#F4C542','#5CB85C','#F25F5C','#4EA8DE','#F4C542','#5CB85C'] }
  ];
  function svg(shape, color) { return '<svg viewBox="0 0 24 24" style="color:' + color + '" fill="currentColor">' + (SHAPES[shape] || SHAPES.dot) + '</svg>'; }
  function doodles(theme) {
    return POS.map(function (p, i) {
      var sh = theme.shapes[i % theme.shapes.length], c = theme.colors[i % theme.colors.length];
      return '<span class="cd" style="left:' + p.x + '%;top:' + p.y + '%;width:' + p.s + 'px;height:' + p.s + 'px;transform:translate(-50%,-50%) rotate(' + p.r + 'deg)">' + svg(sh, c) + '</span>';
    }).join('');
  }
  return {
    THEMES: THEMES,
    byId: function (id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; },
    doodles: doodles, svg: svg
  };
})();
