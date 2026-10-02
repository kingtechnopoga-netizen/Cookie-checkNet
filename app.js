const $ = id => document.getElementById(id);

function esc(v) {
  return String(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function showResult(data, ok) {
  const box = $("result");
  box.className = `result ${ok ? "ok" : "bad"}`;
  box.innerHTML = `
    <div class="result-title">${esc(data.status)}</div>
    <div>${esc(data.reason || "")}</div>
    ${data.expiresAt ? `<div class="meta">Expires: ${esc(data.expiresAt)}</div>` : ""}
    ${data.id ? `<div class="meta">ID: ${esc(data.id)}</div>` : ""}
  `;
}

$("generate").addEventListener("click", async () => {
  const button = $("generate");
  button.disabled = true;
  button.textContent = "Generating…";
  try {
    const r = await fetch("/api/test-cookie/create", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ttlSeconds:Number($("ttl").value)})
    });
    const data = await r.json();
    $("cookie").value = data.cookie;
    showResult({status:"CREATED",reason:"Test cookie generated successfully. You can now check it."}, true);
  } catch {
    showResult({status:"ERROR",reason:"Could not reach the server."}, false);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Generate <b>→</b>';
  }
});

$("check").addEventListener("click", async () => {
  const cookie = $("cookie").value.trim();
  if (!cookie) {
    showResult({status:"INVALID",reason:"Paste a test cookie first."}, false);
    return;
  }
  const button = $("check");
  button.disabled = true;
  button.textContent = "Checking…";
  try {
    const r = await fetch("/api/test-cookie/check", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({cookie})
    });
    const data = await r.json();
    showResult(data, data.status === "VALID");
  } catch {
    showResult({status:"ERROR",reason:"Could not reach the server."}, false);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Check Cookie <span>⌁</span>';
  }
});

fetch("/api/health").then(r=>r.json()).then(d=>{
  $("server").textContent = d.ok ? "Server online" : "Server offline";
}).catch(()=> $("server").textContent="Server offline");
