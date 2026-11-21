(function(){
  var WA = '573123001568';
  var $ = function(s,c){return (c||document).querySelector(s)};
  var $$ = function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

  // Menú móvil
  var mb = $('.menu-btn'), menu = $('.menu');
  if(mb){ mb.addEventListener('click',function(){ var o=menu.classList.toggle('open'); mb.setAttribute('aria-expanded',o); });
    $$('.menu a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open')})}); }

  function toast(msg,ms){ var t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(function(){t.classList.remove('show')},ms||3000); }

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

  // Exportar a PDF (móvil / PC) con html2pdf.js
  var CONF={
    movil:{width:420, format:[111.125,240], scale:2, file:'Reserva-San-Pablo-movil.pdf'},
    pc:{width:1280, format:[338.667,479], scale:1.5, file:'Reserva-San-Pablo-PC.pdf'}
  };
  function waitImages(root){
    return Promise.all($$('img',root).map(function(img){
      img.loading='eager';
      if(img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function(r){ img.onload=img.onerror=r; setTimeout(r,8000); });
    }));
  }
  function exportPDF(kind,btns){
    if(!window.html2pdf){ toast('Cargando herramienta de PDF… intente de nuevo en unos segundos.'); return; }
    var c=CONF[kind], el=$('#pagina');
    btns.forEach(function(b){b.disabled=true});
    toast('Generando PDF '+(kind==='pc'?'PC':'móvil')+'… ⏳',15000);
    document.body.classList.add('pdf-mode');
    var oldW=el.style.width; el.style.width=c.width+'px';
    waitImages(el).then(function(){
      return html2pdf().set({
        margin:0, filename:c.file,
        image:{type:'jpeg',quality:0.9},
        html2canvas:{scale:c.scale,useCORS:true,windowWidth:c.width,scrollX:0,scrollY:0,backgroundColor:'#f7efe2'},
        jsPDF:{unit:'mm',format:c.format,orientation:'portrait'},
        pagebreak:{mode:['css','legacy'],avoid:['.day','.card','.cbox','.rutas','.opcional','.masonry img','.collage']}
      }).from(el).save();
    }).then(function(){ toast('PDF listo ✅'); })
    .catch(function(e){ console.error(e); toast('No se pudo generar el PDF. Use Imprimir > Guardar como PDF.'); })
    .then(function(){ el.style.width=oldW; document.body.classList.remove('pdf-mode'); btns.forEach(function(b){b.disabled=false}); });
  }
  $$('.pdf-btn').forEach(function(b){ b.addEventListener('click',function(){ exportPDF(b.dataset.pdf,$$('.pdf-btn')); }); });
})();
