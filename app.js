(function(){
  var WA = '573123001568';
  var $ = function(s,c){return (c||document).querySelector(s)};
  var $$ = function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var root = document.documentElement;

  // Copia interna usada solo para fabricar el PDF (iframe oculto con ?pdf=1)
  if(/[?&]pdf=1(&|$)/.test(location.search)){ root.classList.add('pdf-mode'); return; }

  // Menú móvil
  var mb = $('.menu-btn'), menu = $('.menu');
  if(mb){ mb.addEventListener('click',function(){ var o=menu.classList.toggle('open'); mb.setAttribute('aria-expanded',o); });
    $$('.menu a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open')})}); }

  function toast(msg,ms){ var t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(function(){t.classList.remove('show')},ms||3000); }

  // ---------- Animaciones de entrada al hacer scroll ----------
  // El contenido queda visible si JS falla: el estado oculto solo existe con la clase .anim (puesta aquí).
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if('IntersectionObserver' in window && !reduce){
    var groups = [
      ['.section .kicker, .section h2, .nosotros .txt > p, .reservar .txt > p, .form-photo, .form', ''],
      ['.chips li', ''],
      ['.card', ''],
      ['.day', ''],
      ['.rutas, .opcional', ''],
      ['.collage img', 'zoom'],
      ['.masonry img', 'zoom'],
      ['.cbox', ''],
      ['.footer > img, .footer > p', '']
    ];
    var items = [];
    groups.forEach(function(g){
      $$(g[0]).forEach(function(el){
        if(el.classList.contains('rv')) return;
        var sib = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.classList.add('rv'); if(g[1]) el.classList.add(g[1]);
        el.style.setProperty('--d', ((sib % 4) * 0.09).toFixed(2) + 's');
        items.push(el);
      });
    });
    root.classList.add('anim');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        var el = e.target; el.classList.add('in'); io.unobserve(el);
        setTimeout(function(){ el.style.removeProperty('--d'); }, 1300);
      });
    }, {rootMargin:'0px 0px -6% 0px', threshold:0.08});
    items.forEach(function(el){ io.observe(el); });
    window.addEventListener('beforeprint', function(){ items.forEach(function(el){ el.classList.add('in'); }); });
  }

  // Fecha mínima = hoy
  var f=$('input[name=fecha]'); if(f){ var d=new Date(); f.min=new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); }

  // Formulario -> WhatsApp
  var form=$('#form-wa');
  if(form) form.addEventListener('submit',function(e){
    e.preventDefault();
    var g=function(n){return (form.elements[n].value||'').trim()};
    var err=$('#form-err'); err.textContent='';
    if(!g('nombre')){ err.textContent='Por favor escriba su nombre.'; form.elements.nombre.focus(); return; }
    if(g('telefono').replace(/\D/g,'').length<7){ err.textContent='Escriba un teléfono válido.'; form.elements.telefono.focus(); return; }
    var acts=$$('input[name=act]:checked',form).map(function(i){return '• '+i.value});
    var fecha=g('fecha'); if(fecha){ var p=fecha.split('-'); fecha=p[2]+'/'+p[1]+'/'+p[0]; }
    var lines=['¡Hola! 🌅 Quiero información para el plan en la *Reserva Natural San Pablo* (#SeformóLaSanpablera).','',
      '👤 *Nombre:* '+g('nombre'), '📞 *Teléfono:* '+g('telefono'), '👥 *Personas:* '+(g('personas')||'—'),
      '📅 *Fecha preferida:* '+(fecha||'Por definir'), '🚙 *Vehículo:* '+(g('vehiculo')||'—')];
    if(acts.length){ lines.push('','🎯 *Me interesa:*'); lines=lines.concat(acts); }
    if(g('mensaje')){ lines.push('','💬 '+g('mensaje')); }
    var url='https://wa.me/'+WA+'?text='+encodeURIComponent(lines.join('\n'));
    var w=window.open(url,'_blank'); if(!w){ location.href=url; }
    toast('Abriendo WhatsApp… ¡solo presione enviar! ✅',4000);
  });

  // ---------- Exportar a PDF (móvil / PC) ----------
  // Se arma una copia de la página en un iframe oculto con el ancho exacto (móvil 414 px / PC 1200 px),
  // se captura sección por sección con html2canvas (lienzos pequeños: sirve en celulares)
  // y se pagina a mano con jsPDF, cortando solo entre fotos, tarjetas y párrafos.
  var H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  var JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  var BG = '#f7efe2';
  var CONF = {
    movil:{w:414, h:860, scale:2, file:'Reserva-San-Pablo-movil.pdf'},   // página tipo celular
    pc:{w:1200, h:848, scale:1.5, file:'Reserva-San-Pablo-PC.pdf'}       // A4 horizontal
  };
  function loadScript(src, doc){
    doc = doc || document;
    return new Promise(function(res, rej){
      var s = doc.createElement('script'); s.src = src;
      s.onload = function(){ res(); }; s.onerror = function(){ rej(new Error('No se pudo cargar ' + src)); };
      (doc.head || doc.documentElement).appendChild(s);
    });
  }
  var jspdfP = null;
  function loadJsPDF(){
    if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    if(!jspdfP) jspdfP = loadScript(JSPDF).catch(function(e){ jspdfP = null; throw e; });
    return jspdfP;
  }
  window.addEventListener('load', function(){ setTimeout(function(){ loadJsPDF().catch(function(){}); }, 3000); });

  function timeout(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function frames(w){ return new Promise(function(r){ w.requestAnimationFrame(function(){ w.requestAnimationFrame(function(){ r(); }); }); }); }

  function makeFrame(c){
    return new Promise(function(res, rej){
      var fr = document.createElement('iframe');
      fr.setAttribute('aria-hidden','true'); fr.tabIndex = -1;
      fr.style.cssText = 'position:fixed;top:0;left:-30000px;width:'+c.w+'px;height:'+c.h+'px;border:0;opacity:0;pointer-events:none;z-index:-1';
      var t = setTimeout(function(){ rej(new Error('La copia de la página tardó demasiado')); }, 30000);
      fr.onload = function(){ clearTimeout(t); res(fr); };
      fr.src = location.href.split('#')[0].split('?')[0] + '?pdf=1';
      document.body.appendChild(fr);
    });
  }

  function prepareFrame(fr, c){
    var w = fr.contentWindow, d = fr.contentDocument;
    if(!d || !d.body) throw new Error('Sin acceso a la copia (abra la página desde el hosting, no como archivo)');
    d.documentElement.classList.add('pdf-mode');
    var imgs = $$('img', d);
    var waits = imgs.map(function(img){
      if(img.getAttribute('loading') === 'lazy') img.loading = 'eager';
      if(img.complete && img.naturalWidth) return Promise.resolve();
      return Promise.race([ new Promise(function(r){ img.addEventListener('load', r); img.addEventListener('error', r); }), timeout(15000) ]);
    });
    var fonts = (d.fonts && d.fonts.ready) ? Promise.race([d.fonts.ready, timeout(6000)]) : Promise.resolve();
    var lib = w.html2canvas ? Promise.resolve() : loadScript(H2C, d);
    return Promise.all([Promise.all(waits), fonts, lib]).then(function(){
      w.scrollTo(0, 0);
      var hero = $('.hero', d); if(hero) hero.style.minHeight = c.h + 'px';   // portada = página completa
      coverToDiv(d, w);   // html2canvas no entiende object-fit:cover: lo pasamos a background-size:cover
      return frames(w);
    });
  }

  function coverToDiv(d, w){
    $$('img', d).forEach(function(img){
      var cs = w.getComputedStyle(img);
      if(cs.objectFit !== 'cover' || !img.naturalWidth || cs.display === 'none') return;
      var r = img.getBoundingClientRect();
      var div = d.createElement('div'), s = div.style;
      div.className = img.className + ' pdf-img';
      s.width = r.width + 'px'; s.height = r.height + 'px'; s.display = 'block';
      s.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")';
      s.backgroundSize = 'cover'; s.backgroundPosition = cs.objectPosition || '50% 50%'; s.backgroundRepeat = 'no-repeat';
      s.borderRadius = cs.borderRadius; s.boxShadow = cs.boxShadow;
      s.marginTop = cs.marginTop; s.marginBottom = cs.marginBottom; s.marginLeft = cs.marginLeft; s.marginRight = cs.marginRight;
      img.parentNode.replaceChild(div, img);
    });
  }

  // Zonas que no se deben partir entre páginas
  var ATOMS = '.hero-inner, .card, .day, .day header, .day li, .cbox, .rutas, .opcional, .precios, .collage > *, .masonry > *, p, h2, h3, .chips li, .btn, .footer > *';
  function measure(d, w){
    var y = w.pageYOffset || 0;
    var box = function(el){ var r = el.getBoundingClientRect(); return {top:r.top + y, bottom:r.bottom + y, h:r.height}; };
    var blocks = $$('#pagina > section, body > footer', d).filter(function(el){ return el.getBoundingClientRect().height > 0; })
      .map(function(el){ var b = box(el); b.el = el; return b; });
    var atoms = $$(ATOMS, d).map(box).filter(function(a){ return a.h > 0; });
    // El título (kicker + h2) siempre acompañado de algo de contenido debajo
    $$('h2', d).forEach(function(h){
      var b = box(h), k = h.previousElementSibling;
      if(k && k.classList.contains('kicker')) b.top = Math.min(b.top, box(k).top);
      b.bottom += 160; b.h = b.bottom - b.top; atoms.push(b);
    });
    // No cortar dentro del margen superior de una sección: el corte se va al inicio de la sección
    blocks.forEach(function(b){
      var first = null;
      atoms.forEach(function(a){ if(a.top >= b.top && a.top < b.bottom && (first === null || a.top < first)) first = a.top; });
      if(first !== null && first > b.top) atoms.push({top:b.top, bottom:first + 2, h:first + 2 - b.top});
    });
    return {blocks:blocks, atoms:atoms, total:blocks.length ? blocks[blocks.length-1].bottom : d.body.scrollHeight};
  }
  function paginate(m, pageH){
    var pages = [], start = m.blocks.length ? m.blocks[0].top : 0;
    while(start < m.total - 2){
      var ideal = start + pageH, cut = ideal;
      if(ideal >= m.total){ cut = m.total; }
      else {
        for(var guard = 0, changed = true; changed && guard < 60; guard++){
          changed = false;
          m.atoms.forEach(function(a){
            if(a.h <= pageH * 0.92 && a.top > start + 1 && a.top < cut - 1 && a.bottom > cut + 1){ cut = a.top; changed = true; }
          });
        }
        // un poco de aire arriba de la página siguiente, sin invadir el elemento anterior
        var atBlock = m.blocks.some(function(b){ return Math.abs(b.top - cut) < 1; });
        if(cut < ideal && !atBlock){
          var prev = start;
          m.atoms.forEach(function(a){ if(a.bottom <= cut + 0.5 && a.bottom > prev) prev = a.bottom; });
          cut = Math.max(prev, cut - 16, start + 1);
        }
        if(cut - start < pageH * 0.35) cut = ideal;
      }
      pages.push({start:start, end:cut});
      start = cut;
    }
    // si al final sobra un pedacito (ej. el crédito del pie), se une a la última página
    var n = pages.length;
    if(n > 1 && pages[n-1].end - pages[n-1].start < pageH * 0.2){ pages[n-2].end = pages[n-1].end; pages.pop(); }
    return pages;
  }

  function exportPDF(kind, btns){
    var c = CONF[kind], fr = null, S = c.scale;
    btns.forEach(function(b){ b.disabled = true; });
    toast('Generando PDF ' + (kind === 'pc' ? 'PC' : 'móvil') + '… ⏳', 60000);
    Promise.all([loadJsPDF(), makeFrame(c)]).then(function(r){
      fr = r[1];
      return prepareFrame(fr, c);
    }).then(function(){
      var w = fr.contentWindow, d = fr.contentDocument;
      var m = measure(d, w), pages = paginate(m, c.h);
      var J = window.jspdf.jsPDF, pw = c.w * 0.75, ph = c.h * 0.75, orient = pw > ph ? 'landscape' : 'portrait';
      var pdf = new J({unit:'pt', format:[pw, ph], orientation:orient, compress:true});
      var pi = 0, cur = null, added = 0;
      function newPage(p){
        var cv = document.createElement('canvas'), last = p === pages[pages.length - 1];
        cv.width = Math.round(c.w * S); cv.height = Math.round((last ? p.end - p.start : c.h) * S);
        var ctx = cv.getContext('2d'); ctx.fillStyle = BG; ctx.fillRect(0, 0, cv.width, cv.height);
        return {p:p, cv:cv, ctx:ctx};
      }
      function finish(pg){
        var used = Math.min(pg.cv.height, Math.round((pg.p.end - pg.p.start) * S));
        if(used < pg.cv.height - 1 && used > 8){   // relleno con el color del borde para no dejar franjas
          var px = pg.ctx.getImageData(4, used - 6, 1, 1).data;
          pg.ctx.fillStyle = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
          pg.ctx.fillRect(0, used, pg.cv.width, pg.cv.height - used);
        }
        var h = pg.cv.height / S * 0.75;
        if(added++) pdf.addPage([pw, h], pw > h ? 'landscape' : 'portrait');
        else if(h < ph) { pdf.deletePage(1); pdf.addPage([pw, h], pw > h ? 'landscape' : 'portrait'); }
        pdf.addImage(pg.cv.toDataURL('image/jpeg', 0.86), 'JPEG', 0, 0, pw, h, undefined, 'FAST');
        pg.cv.width = pg.cv.height = 0;
      }
      var chain = Promise.resolve();
      m.blocks.forEach(function(b, bi){
        chain = chain.then(function(){
          toast('Generando PDF… ' + Math.round(bi / m.blocks.length * 100) + '% ⏳', 60000);
          var sc = S; while(c.w * sc * b.h * sc > 14e6 && sc > 1) sc -= 0.25;   // límite de lienzo en celulares
          return w.html2canvas(b.el, {scale:sc, useCORS:true, backgroundColor:BG, logging:false,
            scrollX:0, scrollY:0, windowWidth:c.w, windowHeight:c.h, width:c.w, height:Math.ceil(b.h)});
        }).then(function(cv){
          var k = cv.height / b.h;
          while(pi < pages.length){
            var p = pages[pi];
            var s0 = Math.max(p.start, b.top), s1 = Math.min(p.end, b.bottom);
            if(s1 > s0){
              if(!cur || cur.p !== p) cur = newPage(p);
              var dy = Math.floor((s0 - p.start) * S), dh = Math.ceil((s1 - s0) * S) + 1;
              cur.ctx.drawImage(cv, 0, Math.floor((s0 - b.top) * k), cv.width, Math.max(1, Math.round((s1 - s0) * k)), 0, dy, cur.cv.width, dh);
            }
            if(p.end <= b.bottom + 0.5){ if(cur && cur.p === p){ finish(cur); cur = null; } pi++; }
            else break;
          }
          cv.width = cv.height = 0;
        });
      });
      return chain.then(function(){ if(cur) finish(cur); pdf.save(c.file); });
    }).then(function(){ toast('PDF listo ✅'); })
    .catch(function(e){ console.error(e); toast('No se pudo generar el PDF. Use Imprimir > Guardar como PDF.', 6000); })
    .then(function(){ if(fr && fr.parentNode) fr.parentNode.removeChild(fr); btns.forEach(function(b){ b.disabled = false; }); });
  }
  $$('.pdf-btn').forEach(function(b){ b.addEventListener('click', function(){ exportPDF(b.dataset.pdf, $$('.pdf-btn')); }); });
})();
