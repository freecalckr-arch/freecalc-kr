/* ============================================================
   프리랜서 계산기 — 공통 스크립트 (common.js)
   공유 링크 자동 채우기 · 토스트 · 결과 공유/복사 로직을
   여기 한 곳에서만 관리합니다. 여기를 고치면 모든 페이지에 반영돼요.
   새 계산기 페이지 제작 시 <script src="common.js"></script>를
   본문 스크립트보다 먼저 추가하고, 아래 함수들을 그대로 가져다 쓰세요.
   ============================================================ */

const Freecalc = (function () {

  /* ── 클립보드 복사: navigator.clipboard가 막힌 환경(샌드박스 미리보기 등)에서는
     textarea+execCommand로 폴백, 그마저 실패하면 prompt()로 수동 복사 유도 ── */
  function fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function copyToClipboard(text) {
    return new Promise((resolve) => {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          () => resolve(true),
          () => resolve(fallbackCopy(text))
        );
      } else {
        resolve(fallbackCopy(text));
      }
    });
  }

  /* ── 토스트 메시지 ── */
  function toast(msg) {
    const el = document.createElement('div');
    el.innerHTML = '<span style="margin-right:6px">✓</span>' + msg;
    el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(6px);background:#EAF2FE;color:#191919;font-size:14px;font-weight:600;padding:12px 20px;border-radius:11px;z-index:99999;opacity:0;transition:opacity .2s,transform .2s;box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;align-items:center;pointer-events:none';
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = 1; el.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => {
      el.style.opacity = 0;
      setTimeout(() => el.remove(), 250);
    }, 2200);
  }

  /* ── 결과 링크 공유: params 객체를 쿼리스트링으로 만들어 클립보드에 복사 ──
     예) Freecalc.shareLink({ amt: raw, mode: mode }); */
  function shareLink(params, msg) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') usp.set(k, v);
    });
    const url = location.origin + location.pathname + '?' + usp.toString();
    copyToClipboard(url).then((ok) => {
      if (ok) toast(msg || '결과 링크를 복사했어요');
      else window.prompt('이 환경에서는 자동 복사가 막혀 있어요. 아래 링크를 직접 복사해주세요:', url);
    });
  }

  /* ── 결과 텍스트 복사 ──
     예) Freecalc.copyText(`[프리랜서 계산기 · 3.3%] ...`); */
  function copyText(text, msg) {
    copyToClipboard(text).then((ok) => {
      if (ok) toast(msg || '결과를 복사했어요');
      else window.prompt('이 환경에서는 자동 복사가 막혀 있어요. 아래 내용을 직접 복사해주세요:', text);
    });
  }

  /* ── 공유 링크로 진입 시 자동 채우기 + 계산 ──
     fields: [
       { param:'amt', el:'amt', type:'amount' },              // 숫자 → 3자리 콤마 포맷 후 입력창에 채움
       { param:'dep', el:'dep', type:'select', allow:['1','2','3','4'] }, // select/드롭다운 값 (허용값 검증)
       { param:'mode', onLoad:(v)=>{ if(v==='net') setMode('net'); } }    // 커스텀 처리(모드 전환 등)
     ]
     calcFn: 값 채운 뒤 실행할 계산 함수 (예: calc) */
  function applyShareParams(fields, calcFn) {
    const p = new URLSearchParams(location.search);
    fields.forEach((f) => {
      const v = p.get(f.param);
      if (v == null) return;
      if (typeof f.onLoad === 'function') {
        f.onLoad(v);
        return;
      }
      const el = document.getElementById(f.el);
      if (!el) return;
      if (f.type === 'amount') {
        if (/^[0-9]+$/.test(v)) el.value = parseInt(v, 10).toLocaleString('ko-KR');
      } else if (f.type === 'select') {
        if (!f.allow || f.allow.includes(v)) el.value = v;
      } else {
        el.value = v;
      }
    });
    if (typeof calcFn === 'function') calcFn();
  }

  return { toast, shareLink, copyText, applyShareParams };
})();
