(function(){
  var WA = '573123001568';
  var PLAN = 'RUTA SAN PABLO – CAÑO CHIQUITO';
  var WA_URL = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('¡Hola! 👋 Quiero información para el plan ' + PLAN + ', en la Reserva Natural San Pablo (#SeformóLaSanpablera).');
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
      ['.fineprint, .video-box', ''],
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
    var dsel=form.querySelector('input[name=dieta]:checked'), dieta=dsel?dsel.value:'';
    if(dieta==='Otra'){ var dox=g('dieta_otra'); dieta='Otra'+(dox?': '+dox:''); }
    var lines=['¡Hola! 👋 Quiero información para el plan *'+PLAN+'*, en la *Reserva Natural San Pablo* (#SeformóLaSanpablera).','',
      '👤 *Nombre:* '+g('nombre'), '📞 *Teléfono:* '+g('telefono'), '👥 *Personas:* '+(g('personas')||'—'),
      '📅 *Fecha preferida:* '+(fecha||'Por definir'), '🚙 *Vehículo:* '+(g('vehiculo')||'—'),
      '🤧 *Alergias:* '+(g('alergia')||'No indica'), '🍽️ *Preferencia alimenticia:* '+(dieta||'No indica')];
    if(acts.length){ lines.push('','🎯 *Me interesa:*'); lines=lines.concat(acts); }
    if(g('mensaje')){ lines.push('','💬 '+g('mensaje')); }
    var url='https://wa.me/'+WA+'?text='+encodeURIComponent(lines.join('\n'));
    var w=window.open(url,'_blank'); if(!w){ location.href=url; }
    toast('Abriendo WhatsApp… ¡solo presione enviar! ✅',4000);
  });

  // Preferencia alimenticia: campo "¿cuál?" solo con "Otra"
  var dOtra=$('#dieta-otra');
  $$('input[name=dieta]').forEach(function(r){ r.addEventListener('change',function(){
    var o=r.value==='Otra'&&r.checked; dOtra.hidden=!o; if(o) dOtra.focus(); else dOtra.value=''; }); });

  // ---------- Galería: visor a pantalla completa ----------
  (function(){
    var thumbs=$$('.masonry img'), lb=$('#lb'); if(!thumbs.length||!lb) return;
    var img=$('.lb-img',lb), cap=$('.lb-cap',lb), idx=0, opener=null;
    var full=function(t){ return (t.getAttribute('data-full')||t.getAttribute('src').replace('-sm.webp','.webp')); };
    function show(i){
      idx=(i+thumbs.length)%thumbs.length; var t=thumbs[idx];
      img.classList.add('ld'); img.onload=img.onerror=function(){ img.classList.remove('ld'); };
      img.src=full(t); img.alt=t.alt; cap.textContent=t.alt+'  ·  '+(idx+1)+' / '+thumbs.length;
      [1,-1].forEach(function(d){ var n=new Image(); n.src=full(thumbs[(idx+d+thumbs.length)%thumbs.length]); });
    }
    function open(i,from){ opener=from; lb.hidden=false; document.body.classList.add('lb-open'); show(i); $('.lb-x',lb).focus(); }
    function close(){ if(lb.hidden) return; lb.hidden=true; document.body.classList.remove('lb-open'); img.removeAttribute('src'); if(opener&&opener.focus) opener.focus({preventScroll:true}); }
    thumbs.forEach(function(t,i){
      t.tabIndex=0; t.setAttribute('role','button');
      t.addEventListener('click',function(){ open(i,t); });
      t.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(i,t); } });
    });
    $('.lb-x',lb).addEventListener('click',close);
    $('.lb-prev',lb).addEventListener('click',function(e){ e.stopPropagation(); show(idx-1); });
    $('.lb-next',lb).addEventListener('click',function(e){ e.stopPropagation(); show(idx+1); });
    lb.addEventListener('click',function(e){ if(e.target===lb||e.target.classList.contains('lb-fig')) close(); });
    document.addEventListener('keydown',function(e){
      if(lb.hidden) return;
      if(e.key==='Escape') close(); else if(e.key==='ArrowLeft') show(idx-1); else if(e.key==='ArrowRight') show(idx+1);
    });
    var x0=null,y0=null;
    lb.addEventListener('touchstart',function(e){ if(e.touches.length>1){ x0=null; return; } x0=e.touches[0].clientX; y0=e.touches[0].clientY; },{passive:true});
    lb.addEventListener('touchend',function(e){
      if(x0===null) return; var dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; x0=null;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4) show(idx+(dx<0?1:-1));
    },{passive:true});
  })();

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
      var fw = window.__pdfFrameW || c.w;
      fr.style.cssText = 'position:fixed;top:0;left:-30000px;width:'+fw+'px;min-width:'+fw+'px;max-width:'+fw+'px;height:'+c.h+'px;border:0;opacity:0;pointer-events:none;z-index:-1';
      var t = setTimeout(function(){ rej(new Error('La copia de la página tardó demasiado')); }, 30000);
      fr.onload = function(){ clearTimeout(t); res(fr); };
      fr.src = location.href.split('#')[0].split('?')[0] + '?pdf=1';
      document.body.appendChild(fr);
    });
  }

  function prepareFrame(fr){
    var w = fr.contentWindow, d = fr.contentDocument;
    if(!d || !d.body) throw new Error('Sin acceso a la copia (abra la página desde el hosting, no como archivo)');
    d.documentElement.classList.add('pdf-mode');
    var imgs = $$('img', d);
    var waits = imgs.map(function(img){
      img.loading = 'eager'; img.removeAttribute('loading');
      var done = (img.complete && img.naturalWidth) ? Promise.resolve()
        : Promise.race([ new Promise(function(r){ img.addEventListener('load', r); img.addEventListener('error', r); }), timeout(20000) ]);
      // decode(): en iPhone la foto debe estar decodificada antes de "fotografiar"
      return done.then(function(){ return img.decode ? img.decode().catch(function(){}) : null; });
    });
    var fonts = (d.fonts && d.fonts.ready) ? Promise.race([d.fonts.ready, timeout(6000)]) : Promise.resolve();
    var lib = w.html2canvas ? Promise.resolve() : loadScript(H2C, d);
    return Promise.all([Promise.all(waits), fonts, lib]).then(function(){
      w.scrollTo(0, 0);
      coverToDiv(d, w);
      return preloadBackgrounds(d, w);
    }).then(function(){ return frames(w); });
  }

  // html2canvas no entiende object-fit:cover -> se cambia por un div con background-size:cover.
  // Tamaño relativo (100% + aspect-ratio) para que funcione con cualquier ancho real del iframe (iPhone).
  var hasAR = window.CSS && CSS.supports && CSS.supports('aspect-ratio', '1 / 1');
  function coverToDiv(d, w){
    $$('img', d).forEach(function(img){
      var cs = w.getComputedStyle(img);
      if(cs.objectFit !== 'cover' || !img.naturalWidth || cs.display === 'none') return;
      var r = img.getBoundingClientRect();
      var div = d.createElement('div'), s = div.style;
      div.className = img.className + ' pdf-img';
      s.display = 'block';
      if(cs.position === 'absolute'){ s.position = 'absolute'; s.left = s.top = '0'; s.width = s.height = '100%'; }
      else if(hasAR && r.height){ s.width = '100%'; s.height = 'auto'; s.aspectRatio = (r.width / r.height).toFixed(4); }
      else { s.width = r.width + 'px'; s.height = r.height + 'px'; }
      s.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")';
      s.backgroundSize = 'cover'; s.backgroundPosition = cs.objectPosition || '50% 50%'; s.backgroundRepeat = 'no-repeat';
      s.borderRadius = cs.borderRadius; s.boxShadow = cs.boxShadow;
      s.marginTop = cs.marginTop; s.marginBottom = cs.marginBottom;
      img.parentNode.replaceChild(div, img);
    });
  }
  // Precarga y decodifica todas las imágenes de fondo (CSS) antes de capturar
  function preloadBackgrounds(d, w){
    var urls = {};
    $$('*', d).forEach(function(el){
      var bg = w.getComputedStyle(el).backgroundImage, m, re = /url\(["']?([^"')]+)["']?\)/g;
      while(bg && (m = re.exec(bg))) urls[m[1]] = 1;
    });
    return Promise.all(Object.keys(urls).map(function(u){
      return Promise.race([ new Promise(function(r){
        var im = new Image(); im.onload = function(){ (im.decode ? im.decode() : Promise.resolve()).then(r, r); }; im.onerror = r; im.src = u;
      }), timeout(15000) ]);
    }));
  }

  // Zonas que no se deben partir entre páginas (medidas DENTRO de la copia que html2canvas dibuja)
  var ATOMS = '.hero-inner, .card, .day, .day header, .day li, .cbox, .rutas, .opcional, .precios, .collage > *, .masonry > *, p, h2, h3, .chips li, .btn, .footer > *';
  function measureBlock(el){
    var top = el.getBoundingClientRect().top;
    var box = function(e){ var r = e.getBoundingClientRect(); return {top:r.top - top, bottom:r.bottom - top, h:r.height}; };
    var atoms = $$(ATOMS, el).map(box).filter(function(a){ return a.h > 0; });
    $$('h2', el).forEach(function(h){   // título (kicker + h2) siempre con algo de contenido debajo
      var b = box(h), k = h.previousElementSibling;
      if(k && k.classList.contains('kicker')) b.top = Math.min(b.top, box(k).top);
      b.bottom += 160; b.h = b.bottom - b.top; atoms.push(b);
    });
    var first = null;   // no cortar dentro del margen superior de la sección
    atoms.forEach(function(a){ if(first === null || a.top < first) first = a.top; });
    if(first !== null && first > 0) atoms.push({top:0, bottom:first + 2, h:first + 2});
    var r = el.getBoundingClientRect();
    // Enlaces visibles (botones, teléfonos, correo, redes, mapa, crédito): un rectángulo por línea
    var links = [];
    $$('a[href]', el).forEach(function(a){
      Array.prototype.forEach.call(a.getClientRects(), function(rc){
        if(rc.width < 2 || rc.height < 2) return;
        links.push({href:a.getAttribute('href') || '', abs:a.href || '', x:rc.left - r.left, w:rc.width, top:rc.top - top, bottom:rc.bottom - top});
      });
    });
    return {h:r.height, w:r.width, atoms:atoms, links:links};
  }
  function paginate(blocks, total, pageH){
    var atoms = [];
    blocks.forEach(function(b){ b.atoms.forEach(function(a){ atoms.push({top:a.top + b.top, bottom:a.bottom + b.top, h:a.h}); }); });
    var pages = [], start = 0;
    while(start < total - 2){
      var ideal = start + pageH, cut = ideal;
      if(ideal >= total){ cut = total; }
      else {
        for(var guard = 0, changed = true; changed && guard < 60; guard++){
          changed = false;
          atoms.forEach(function(a){
            if(a.h <= pageH * 0.92 && a.top > start + 1 && a.top < cut - 1 && a.bottom > cut + 1){ cut = a.top; changed = true; }
          });
        }
        if(cut - start < pageH * 0.35) cut = ideal;
        var atBlock = blocks.some(function(b){ return Math.abs(b.top - cut) < 1; });
        if(cut < ideal && !atBlock){   // un poco de aire arriba de la página siguiente
          var prev = start;
          atoms.forEach(function(a){ if(a.bottom <= cut + 0.5 && a.bottom > prev) prev = a.bottom; });
          cut = Math.max(prev, cut - 16, start + 1);
        }
      }
      pages.push({start:start, end:cut});
      start = cut;
    }
    var n = pages.length;   // si al final sobra un pedacito (ej. el crédito del pie), se une a la última página
    if(n > 1 && pages[n-1].end - pages[n-1].start < pageH * 0.2){ pages[n-2].end = pages[n-1].end; pages.pop(); }
    return pages;
  }
  // ¿El lienzo salió vacío? (falla típica de iPhone por memoria)
  function looksBlank(cv){
    try{
      var x = cv.getContext('2d'), n = 0, W = cv.width, H = cv.height;
      for(var i = 1; i <= 6; i++){ var px = x.getImageData(Math.floor(W * i / 7), Math.floor(H / 2), 1, 1).data; if(px[3] === 0) n++; }
      return n >= 6;
    }catch(e){ return false; }
  }

  function exportPDF(kind, btns){
    var c = CONF[kind], fr = null, S = c.scale, isPhone = kind === 'movil';
    btns.forEach(function(b){ b.disabled = true; });
    toast('Generando PDF ' + (kind === 'pc' ? 'PC' : 'móvil') + '… ⏳', 90000);
    Promise.all([loadJsPDF(), makeFrame(c)]).then(function(r){
      fr = r[1];
      return prepareFrame(fr);
    }).then(function(){
      var w = fr.contentWindow, d = fr.contentDocument;
      // Ancho REAL de la copia (en iPhone el iframe puede no quedar del ancho pedido): todo se mide con él
      var W = Math.round(d.documentElement.clientWidth) || c.w, pageH = Math.round(c.h * W / c.w);
      var hero = $('.hero', d); if(hero) hero.style.minHeight = pageH + 'px';   // portada = página completa
      var els = $$('#pagina > section, body > footer', d).filter(function(el){ return el.getBoundingClientRect().height > 0; });
      els.forEach(function(el, i){ el.setAttribute('data-pdfb', i); });
      var blocks = [], y = 0, links = [];
      var chain = frames(w);
      els.forEach(function(el, i){
        chain = chain.then(function(){
          toast('Generando PDF… ' + Math.round(i / els.length * 100) + '% ⏳', 90000);
          var h0 = el.getBoundingClientRect().height, sc = S;
          var maxArea = isPhone ? 10e6 : 16e6;   // límite de lienzo en celulares
          while(W * sc * h0 * sc > maxArea && sc > 1) sc -= 0.25;
          var info = null;
          function shoot(scale, size){
            var o = {scale:scale, useCORS:true, allowTaint:false, imageTimeout:20000, backgroundColor:BG, logging:false,
              scrollX:0, scrollY:0, windowWidth:W, windowHeight:pageH};
            if(size){ o.width = Math.ceil(size.w); o.height = Math.ceil(size.h); }
            return w.html2canvas(el, Object.assign(o, {
              onclone:function(cd){ var ce = cd.querySelector('[data-pdfb="' + i + '"]'); if(ce) info = measureBlock(ce); }}));
          }
          return shoot(sc).then(function(cv){
            if(!cv.width || !cv.height || looksBlank(cv)){ sc = Math.max(1, sc - 0.5); return timeout(300).then(function(){ return shoot(sc); }); }
            // si la copia quedó más alta que el original, html2canvas recorta el final: se repite con el alto real
            if(info && Math.abs(info.h - cv.height / sc) > 2){ var sz = {w:info.w, h:info.h}; cv.width = cv.height = 0; return shoot(sc, sz); }
            return cv;
          }).then(function(cv){
            if(!info) info = measureBlock(el);
            var hh = cv.height / sc;   // alto real dibujado
            var f = hh / (info.h || hh), fx = c.w * 0.75 / (info.w || W), y0 = y;
            blocks.push({cv:cv, id:el.id, top:y, h:hh, bottom:y + hh, k:cv.height / hh, atoms:info.atoms.map(function(a){
              return {top:a.top * f, bottom:a.bottom * f, h:a.h * f}; })});
            (info.links || []).forEach(function(l){
              links.push({href:l.href, abs:l.abs, x:l.x * fx, w:l.w * fx, top:y0 + l.top * f, bottom:y0 + l.bottom * f});
            });
            y += hh;
          });
        });
      });
      return chain.then(function(){
        var pages = paginate(blocks, y, pageH);
        var J = window.jspdf.jsPDF, pw = c.w * 0.75, ph = c.h * 0.75, orient = pw > ph ? 'landscape' : 'portrait';
        var pdf = new J({unit:'pt', format:[pw, ph], orientation:orient, compress:true});
        var PS = S * c.w / W;   // pixeles del lienzo de página por px css de la copia
        var PT = PS / S * 0.75;  // puntos PDF por px css de la copia
        function pageOf(yy){ for(var n = 0; n < pages.length; n++){ if(yy < pages[n].end) return n + 1; } return pages.length; }
        function target(l){
          if(l.href.charAt(0) === '#'){
            var id = l.href.slice(1);
            if(id === 'reservar' || !id) return {url:WA_URL};   // "Quiero reservar" -> WhatsApp
            for(var n = 0; n < blocks.length; n++){ if(blocks[n].id === id) return {pageNumber:pageOf(blocks[n].top + 1)}; }
            return null;
          }
          return /^(https?:|tel:|mailto:)/i.test(l.abs) ? {url:l.abs} : null;
        }
        pages.forEach(function(p, pi){
          var last = pi === pages.length - 1;
          var cv = document.createElement('canvas');
          cv.width = Math.round(c.w * S); cv.height = Math.round((last ? p.end - p.start : pageH) * PS);
          var ctx = cv.getContext('2d'); ctx.fillStyle = BG; ctx.fillRect(0, 0, cv.width, cv.height);
          blocks.forEach(function(b){
            var s0 = Math.max(p.start, b.top), s1 = Math.min(p.end, b.bottom);
            if(s1 <= s0) return;
            ctx.drawImage(b.cv, 0, Math.floor((s0 - b.top) * b.k), b.cv.width, Math.max(1, Math.round((s1 - s0) * b.k)),
              0, Math.floor((s0 - p.start) * PS), cv.width, Math.ceil((s1 - s0) * PS) + 1);
          });
          var used = Math.min(cv.height, Math.round((p.end - p.start) * PS));
          if(used < cv.height - 1 && used > 8){   // relleno con el color del borde para no dejar franjas
            var px = ctx.getImageData(4, used - 6, 1, 1).data;
            ctx.fillStyle = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
            ctx.fillRect(0, used, cv.width, cv.height - used);
          }
          var h = cv.height / S * 0.75;
          if(pi) pdf.addPage([pw, h], pw > h ? 'landscape' : 'portrait');
          else if(Math.abs(h - ph) > 0.5){ pdf.deletePage(1); pdf.addPage([pw, h], pw > h ? 'landscape' : 'portrait'); }
          pdf.addImage(cv.toDataURL('image/jpeg', 0.86), 'JPEG', 0, 0, pw, h, undefined, 'FAST');
          // Enlaces clicables sobre la imagen (si un enlace queda partido entre páginas, va en ambas)
          links.forEach(function(l){
            var t0 = Math.max(l.top, p.start), t1 = Math.min(l.bottom, p.end);
            if(t1 - t0 < 4) return;
            var tg = target(l); if(!tg) return;
            pdf.link(Math.max(0, l.x - 2), (t0 - p.start) * PT - 2, l.w + 4, (t1 - t0) * PT + 5, tg);   // margen: área cómoda para el dedo
          });
          cv.width = cv.height = 0;
        });
        blocks.forEach(function(b){ b.cv.width = b.cv.height = 0; });
        pdf.save(c.file);
      });
    }).then(function(){ toast('PDF listo ✅'); })
    .catch(function(e){ console.error(e); toast('No se pudo generar el PDF. Use Imprimir > Guardar como PDF.', 6000); })
    .then(function(){ if(fr && fr.parentNode) fr.parentNode.removeChild(fr); btns.forEach(function(b){ b.disabled = false; }); });
  }
  $$('.pdf-btn').forEach(function(b){ b.addEventListener('click', function(){ exportPDF(b.dataset.pdf, $$('.pdf-btn')); }); });
})();
