window.FBTBundle = (function () {
  const DEFAULT_MONEY_FORMAT = '¥{{amount}}';
  // 轻量缓存，便于立即打开抽屉时填充，避免空白
  let cartCache = null;
  let cartCacheTime = 0;
  let lastAddController = null;

  function parseMoneyFormat() {
    const el = document.querySelector('[data-wetheme-section-type="template--product"]');
    const format = el?.getAttribute('data-money-format');
    return format && format.includes('{{amount') ? format : DEFAULT_MONEY_FORMAT;
  }

  function defaultTo(value, fallback) {
    return value == null || value !== value ? fallback : value;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultTo(precision, 2);
    thousands = defaultTo(thousands, ',');
    decimal = defaultTo(decimal, '.');
    if (isNaN(number) || number == null) return '0';
    number = (number / 100.0).toFixed(precision);
    const parts = number.split('.');
    const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    const centsAmount = parts[1] ? (decimal + parts[1]) : '';
    return dollarsAmount + centsAmount;
  }

  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = parseFloat(cents) * 100;
    cents = parseInt(cents, 10) || 0;
    const formatString = format || DEFAULT_MONEY_FORMAT;
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    let value = '';

    switch ((formatString.match(placeholderRegex) || [, 'amount'])[1]) {
      case 'amount': value = formatWithDelimiters(cents, 2); break;
      case 'amount_no_decimals': value = formatWithDelimiters(cents, 0); break;
      case 'amount_with_comma_separator': value = formatWithDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = formatWithDelimiters(cents, 0, '.', ','); break;
      case 'amount_no_decimals_with_space_separator': value = formatWithDelimiters(cents, 0, ' '); break;
      default: value = formatWithDelimiters(cents, 2);
    }
    return formatString.replace(placeholderRegex, value);
  }

  let recalcTimer = null;
  function finishAddButton(btn, mode) {
    if (!btn) return;
    try {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      btn.dataset.adding = '0';
      btn.dataset.addedHandled = '1';
      if (mode === 'added') {
        const original = btn.dataset.originalText || btn.textContent || '';
        btn.textContent = 'Added';
        setTimeout(function(){ try { btn.textContent = original; } catch(e){} }, 800);
      } else {
        if (btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
      }
    } catch(e) {}
  }

  function getCheckedItems(bundle) {
    return bundle.querySelectorAll('.fbt-item [data-fbt-checkbox]:checked, .fbt-item input.fbt-item-checkbox[type="checkbox"]:checked, .fbt-item input[type="checkbox"]:checked');
  }

  function recalc(bundleId) {
    clearTimeout(recalcTimer);
    recalcTimer = setTimeout(() => {
      const bundle = document.getElementById(bundleId);
      if (!bundle) return;

      const moneyFormat = parseMoneyFormat();
      const configuredDiscountPct = parseFloat(bundle.getAttribute('data-discount')) || 0;

      // 同步所有选择器对应的缩略图
      try {
        bundle.querySelectorAll('[data-fbt-variant]').forEach(function (sel) {
          if (sel && sel.tagName === 'SELECT') updateThumbFromSelect(sel);
        });
      } catch(e) {}

      // 更新单个价格
      bundle.querySelectorAll('.fbt-item').forEach(function (wrap) {
        const priceEl = wrap.querySelector('.fbt-price');
        let cents = 0;
        if (wrap.getAttribute('data-variant-source') === 'current') {
          cents = parseInt(priceEl?.getAttribute('data-price-cents') || '0', 10) || 0;
        } else {
          const sel = wrap.querySelector('[data-fbt-variant]');
          if (sel && sel.tagName === 'SELECT') {
            const opt = sel.options[sel.selectedIndex];
            cents = parseInt(
              opt?.dataset.price || opt?.getAttribute('data-price') ||
              sel?.dataset.price || sel?.getAttribute('data-price') || '0',
              10
            ) || 0;
          } else if (sel) {
            cents = parseInt(sel.dataset.price || sel.getAttribute('data-price') || '0', 10) || 0;
          }
        }
        if (priceEl) {
          priceEl.setAttribute('data-price-cents', String(cents));
          const moneySpan = priceEl.querySelector('.money');
          if (moneySpan) moneySpan.innerHTML = formatMoney(cents, moneyFormat);
        }
      });

      // 总价计算
      let total = 0;
      const checkedItems = getCheckedItems(bundle);
      const checkedCount = checkedItems.length;
      const selectedIds = [];

      checkedItems.forEach(function (cb) {
        const wrap = cb.closest('.fbt-item');
        const priceEl = wrap?.querySelector('.fbt-price');
        const cents = parseInt(priceEl?.getAttribute('data-price-cents') || '0', 10) || 0;
        total += cents;
        const variantSelect = wrap.querySelector('[data-fbt-variant]');
        const vid = variantSelect ? parseInt(variantSelect.value, 10) : null;
        if (vid) selectedIds.push(vid);
      });

      // 折扣 - 只有当选择了额外产品时才应用折扣
      // 检查是否选择了主产品之外的其他产品
      // 主产品总是被选中的（已禁用取消选择）
      const mainProductChecked = true;
      const otherProductsChecked = Array.from(checkedItems).some(cb => !cb.closest('.fbt-item--current'));
      
      // 只有当主产品被选中且至少有一个其他产品被选中时才应用折扣
      const effectiveDiscountPct = (mainProductChecked && otherProductsChecked) ? configuredDiscountPct : 0;
      const originalCents = total;
      const finalCents = effectiveDiscountPct > 0
        ? Math.round(total * (1 - effectiveDiscountPct / 100))
        : total;

      const finalEl = bundle.querySelector('.fbt-total-final');
      const originEl = bundle.querySelector('.fbt-total-original');
      if (finalEl) finalEl.innerHTML = formatMoney(finalCents, moneyFormat);
      if (originEl) {
        originEl.style.display = effectiveDiscountPct > 0 ? 'inline-block' : 'none';
        originEl.innerHTML = effectiveDiscountPct > 0 ? formatMoney(originalCents, moneyFormat) : '';
      }
      
      // 更新折扣提示信息的显示/隐藏
      const discountNote = bundle.querySelector('.fbt-note');
      if (discountNote) {
        discountNote.style.display = effectiveDiscountPct > 0 ? 'block' : 'none';
      }
      
      // 更新顶部折扣副标题的显示/隐藏
      const discountSubtitle = bundle.querySelector('.fbt-subtitle');
      if (discountSubtitle) {
        discountSubtitle.style.display = effectiveDiscountPct > 0 ? 'block' : 'none';
      }

      // 更新按钮状态
      const btn = bundle.querySelector('.fbt-add-to-cart');
      if (btn) {
        btn.setAttribute('data-fbt-checked-count', String(checkedCount));
        btn.setAttribute('data-fbt-selected-ids', selectedIds.join(','));
        btn.setAttribute('data-fbt-total-cents', String(finalCents));
      }
    }, 100);
  }

  function updateThumbFromSelect(selectEl) {
    try {
      if (!selectEl) return;
      const wrap = selectEl.closest('.fbt-item');
      if (!wrap) return;
      // 优先切换预渲染的每个变体对应的图片
      const vid = parseInt(selectEl.value, 10);
      const allThumbs = wrap.querySelectorAll('.fbt-thumb .fbt-variant-thumb');
      if (allThumbs.length) {
        allThumbs.forEach(function (im) {
          if (parseInt(im.getAttribute('data-vid'), 10) === vid) {
            im.style.display = '';
          } else {
            im.style.display = 'none';
          }
        });
        return;
      }
      // 兜底：只有单张图片时，直接替换 src
      const img = wrap.querySelector('.fbt-thumb img');
      if (!img) return;
      if (selectEl.tagName !== 'SELECT') return;
      const opt = selectEl.options[selectEl.selectedIndex];
      if (!opt) return;
      const imgUrl = opt.dataset.image || opt.getAttribute('data-image');
      const mediaId = opt.dataset.mediaId || opt.getAttribute('data-media-id');
      const alt = opt.dataset.title || opt.getAttribute('data-title') || img.alt;
      if (imgUrl) img.src = imgUrl;
      if (mediaId) img.setAttribute('data-media-id', mediaId);
      if (alt) img.alt = alt;
    } catch(e) {}
  }

  function buildPayload(bundleId) {
    const bundle = document.getElementById(bundleId);
    if (!bundle) return [];
    const items = [];
    const checkedCbs = bundle.querySelectorAll('[data-fbt-checkbox]:checked');
    checkedCbs.forEach(function (cb) {
      const wrap = cb.closest('.fbt-item');
      if (!wrap) return;
      const qty = 1;
      if (wrap.getAttribute('data-variant-source') === 'current') {
        const variantInput = document.querySelector('#AddToCartForm input[name="id"], #AddToCartForm select[name="id"]');
        const variantId = parseInt(variantInput?.value, 10);
        if (variantId) {
          items.push({ id: variantId, quantity: qty });
        } else {
          console.warn('[FBT] Missing current product variant id.');
        }
      } else {
        const sel = wrap.querySelector('[data-fbt-variant]');
        let opt = null;
        if (sel && sel.tagName === 'SELECT') {
          opt = sel.options[sel.selectedIndex];
        }
        const isAvailable = opt ? (String(opt.dataset.available) !== 'false') : true;
        const vid = parseInt((opt?.value || sel?.value), 10);
        if (vid && isAvailable) {
          items.push({ id: vid, quantity: qty });
        } else {
          const title = (wrap.querySelector('.fbt-title-line')?.textContent || '').trim();
          console.warn('[FBT] Skip item (unavailable or missing variant):', { title, vid, isAvailable });
        }
      }
    });
    try {
      const expected = checkedCbs.length;
      if (items.length !== expected) {
        console.warn('[FBT] Built payload count mismatch', { expected, built: items.length, items });
      } else {
        console.log('[FBT] Built payload', items);
      }
    } catch(e) {}
    return items;
  }

  // AJAX 提交单个商品
  function submitOne(id, quantity) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id, quantity })
    }).then(res => res.json());
  }

   // 打开右侧购物车抽屉（与主题 right-drawer 兼容）
   function openCartDrawerWithData() {
     try {
       if (typeof window.getDrawerVueInstance === 'function') {
         const inst = window.getDrawerVueInstance();
         if (inst) {
           inst.type = 'cart';
           inst.isOpen = true;
           if (typeof inst.$forceUpdate === 'function') inst.$forceUpdate();
           return true;
         }
       }
       // 其它主题兜底
       if (window.theme?.CartDrawer?.open) { window.theme.CartDrawer.open(); return true; }
       if (window.Cart?.open) { window.Cart.open(); return true; }
       const toggle = document.querySelector('[data-cart-toggle], [data-drawer-toggle="cart"], [aria-controls="CartDrawer"]');
       if (toggle) { toggle.click(); return true; }
     } catch(e) {}
     return false;
   }

  function addToCart(bundleId) {
    const payload = buildPayload(bundleId);
    if (!payload.length) return;
    const btn = document.querySelector('#' + bundleId + ' .fbt-add-to-cart');
    if (btn) btn.classList.add('is-loading');
    if (btn) {
      try {
        btn.dataset.originalText = btn.textContent || '';
        btn.textContent = 'Adding…';
        btn.disabled = true;
      } catch(e) {}
    }

    // 更快：一次性批量加购，返回即先打开抽屉，再并行刷新 compare 数据
    // 防抖并中断上一次未完成的请求
    if (btn) {
      if (btn.dataset.adding === '1') return; // 已在进行中
      btn.dataset.adding = '1';
    }
    try { lastAddController?.abort(); } catch(e) {}
    const controller = new AbortController();
    lastAddController = controller;

    // 预抓旧购物车，用于校验是否全部写入（在后台进行，不阻塞抽屉显示）
    let beforeCartMap = {};
    const fetchBefore = fetch('/cart.js', { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
      .then(r => r.json())
      .then(c => {
        beforeCartMap = (c.items || []).reduce((m, it) => { m[it.variant_id] = (m[it.variant_id]||0) + it.quantity; return m; }, {});
        // 更新缓存
        cartCache = c;
        cartCacheTime = Date.now();
      })
      .catch(()=>{});

    fetch('/cart/add.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: payload }),
      signal: controller.signal
    })
    .then(res => {
      if (!res.ok) throw new Error('add_failed');
      // 立即结束按钮 loading，体感更快
      finishAddButton(btn, 'added');
      // 仅获取 compare 视图用于更新抽屉（更少的往返），后台再刷新 /cart.js 缓存
      const langRoot = (window.wetheme && window.wetheme.languageUrl && window.wetheme.languageUrl !== '/') ? window.wetheme.languageUrl : '';
      // 快速用 /cart.js 填充抽屉，避免出现空白或“空购物车”
      const fastCart = fetch('/cart.js', { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
        .then(r => r.json())
        .then(cartJson => {
          cartCache = cartJson; cartCacheTime = Date.now();
          const inst = window.getDrawerVueInstance?.();
          if (inst) {
            inst.type = 'cart';
            inst.cart = cartJson;
            inst.isOpen = true;
            inst.$forceUpdate?.();
          }
          // 仅在已注入 cart 后再打开抽屉，避免空白闪烁
          try { window.wetheme?.toggleRightDrawer?.('cart', true); } catch(e) {}
          // 触发主题常用事件，便于其它监听联动
          try { document.dispatchEvent(new CustomEvent('cart:refresh')); } catch(e) {}
          try { document.dispatchEvent(new CustomEvent('product:added')); } catch(e) {}
          if (window.jQuery) { try { jQuery(document).trigger('cart:refresh').trigger('product:added'); } catch(e) {} }
        })
        .catch(()=>{});
      const compareCart = fetch(`${langRoot}/cart?view=compare`, { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
        .then(rr => rr.json())
        .then(cartCompare => {
          try { window.wetheme?.updateCartDrawer?.(cartCompare); }
          catch(e) { const inst2 = window.getDrawerVueInstance?.(); if (inst2) { inst2.cart = cartCompare; inst2.$forceUpdate?.(); } }
          // 后台刷新标准 cart.js 以更新缓存（不影响已显示的 compare）
          fetch('/cart.js', { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
            .then(r => r.json())
            .then(c => { cartCache = c; cartCacheTime = Date.now(); })
            .catch(()=>{});
        })
        .catch(()=>{});

      // 校验是否全部写入，若缺失则依次补写
      const verifyAndFix = Promise.all([fastCart, fetchBefore]).then(() =>
        fetch('/cart.js', { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
          .then(r => r.json())
          .then(async afterCart => {
            const afterMap = (afterCart.items || []).reduce((m, it) => { m[it.variant_id] = (m[it.variant_id]||0) + it.quantity; return m; }, {});
            const missing = [];
            payload.forEach(({id}) => {
              const beforeQ = beforeCartMap[id] || 0;
              const afterQ = afterMap[id] || 0;
              if (afterQ <= beforeQ) missing.push(id);
            });
            for (const mid of missing) {
              try { await submitOne(mid, 1); } catch(e) {}
            }
            // 修复后再刷新缓存
            try {
              const fixed = await fetch('/cart.js', { headers: { 'Accept': 'application/json' }, cache: 'no-store' }).then(r => r.json());
              cartCache = fixed; cartCacheTime = Date.now();
            } catch(e) {}
          })
          .catch(()=>{})
      );

      // 不阻塞 UI：任一完成都会更新，整体以 compare 为最终结果
      return Promise.race([compareCart, verifyAndFix]).then(() => compareCart);
    })
    .catch(() => { window.location.href = '/cart'; })
    .finally(() => {
      if (btn) {
        if (btn.dataset.addedHandled !== '1') {
          btn.classList.remove('is-loading');
          try {
            btn.textContent = btn.dataset.originalText || btn.textContent;
            btn.disabled = false;
            btn.dataset.adding = '0';
          } catch(e) {}
        }
      }
    });
  }

  function init() {
    document.querySelectorAll('[data-fbt="bundle"]').forEach(function (bundle) {
      if (bundle.getAttribute('data-fbt-attached') === '1') return;
      bundle.setAttribute('data-fbt-attached', '1');
      const bundleId = bundle.id;

      bundle.querySelectorAll('[data-fbt-checkbox]').forEach(function (cb) {
        cb.addEventListener('change', function () { recalc(bundleId); });
      });

      bundle.querySelectorAll('.fbt-check').forEach(function (lbl) {
        lbl.addEventListener('click', function (e) {
          const input = lbl.querySelector('[data-fbt-checkbox]');
          if (input && !input.hasAttribute('data-main-product')) {
            input.checked = !input.checked;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            e.preventDefault();
          }
        });
      });

      bundle.querySelectorAll('[data-fbt-variant]').forEach(function (sel) {
        sel.addEventListener('change', function (e) {
          e.stopPropagation();
          updateThumbFromSelect(sel);
          recalc(bundleId);
        }, true);
        sel.addEventListener('click', function (e) { e.stopPropagation(); }, true);
        // 初始同步一次缩略图
        updateThumbFromSelect(sel);
      });

      const btn = bundle.querySelector('.fbt-add-to-cart');
      if (btn) {
        btn.addEventListener('click', function () { addToCart(bundleId); });
      }

      ['click', 'input', 'keyup'].forEach(function (evt) {
        bundle.addEventListener(evt, function () { recalc(bundleId); }, { passive: true, capture: true });
      });

      recalc(bundleId);
    });

    let docTimer = null;
    function recalcAllDebounced() {
      clearTimeout(docTimer);
      docTimer = setTimeout(function () {
        document.querySelectorAll('[data-fbt="bundle"]').forEach(function (b) { if (b.id) recalc(b.id); });
      }, 120);
    }
    ['change', 'input', 'click', 'keyup'].forEach(function (evt) {
      document.addEventListener(evt, recalcAllDebounced, true);
    });
  }

  return { init, recalc, formatMoney, parseMoneyFormat, addToCart };
})();

document.addEventListener('DOMContentLoaded', function () {
  window.FBTBundle.init();
  // 预热购物车缓存，后续点击能更快显示
  try {
    fetch('/cart.js', { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
      .then(r => r.json())
      .then(c => { cartCache = c; cartCacheTime = Date.now(); })
      .catch(()=>{});
  } catch(e) {}
});

document.addEventListener('variant:changed', function (e) {
  const variant = e?.detail?.variant || e?.detail;
  if (!variant) return;
  const price = variant.price || variant?.price_amount || 0;
  document.querySelectorAll('.fbt-bundle .fbt-item--current .fbt-price').forEach(function (el) {
    el.setAttribute('data-price-cents', String(price));
    const money = el.querySelector('.money');
    if (money) {
      money.innerHTML = window.FBTBundle.formatMoney(price, window.FBTBundle.parseMoneyFormat());
    }
    const bundle = el.closest('.fbt-bundle');
    if (bundle) window.FBTBundle.recalc(bundle.id);
  });
});

document.addEventListener('click', function (e) {
  const target = e.target;
  if (!target || typeof target.closest !== 'function') return;
  const btn = target.closest('.fbt-add-to-cart');
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    const bundle = btn.closest('[data-fbt="bundle"]');
    if (bundle && bundle.id && window.FBTBundle && typeof window.FBTBundle.addToCart === 'function') {
      window.FBTBundle.addToCart(bundle.id);
    }
  }
}, true);
