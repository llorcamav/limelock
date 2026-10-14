/* LimeLock shared store — a tiny localStorage bridge used by the portal
   (app.html), the tech route app (tech-route.html), and the marketing
   quote form. Two channels:
     • limelock_requests   — a customer's submitted request → CEO dispatch queue + tech list
     • limelock_completions — a tech's finished service + report → CEO "Field activity" (live)
   A BroadcastChannel pushes changes to every open same-origin window instantly;
   the storage event + a poll are fallbacks. Stands in for a real backend. */
(function(){
  "use strict";
  var KEY = "limelock_requests";
  var CKEY = "limelock_completions";
  var BC = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel("limelock_live") : null;

  function read(){ try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch(e){ return []; } }
  function write(list){ try { localStorage.setItem(KEY, JSON.stringify(list)); } catch(e){} }
  function cread(){ try { return JSON.parse(localStorage.getItem(CKEY) || "[]"); } catch(e){ return []; } }
  function cwrite(list){ try { localStorage.setItem(CKEY, JSON.stringify(list)); } catch(e){} }
  function ping(msg){ try { if(BC) BC.postMessage(msg); } catch(e){} }

  window.LLStore = {
    all: read,
    add: function(req){ var l = read(); l.push(req); write(l); return req; },
    update: function(id, patch){
      var l = read(), i = l.findIndex(function(r){ return r.id === id; });
      if(i >= 0){ Object.assign(l[i], patch); write(l); }
      return i >= 0 ? l[i] : null;
    },
    nextId: function(){
      var l = read(), max = 2101; // stay above the seeded staff demo ids
      l.forEach(function(r){ var n = parseInt(String(r.id||"").replace(/\D/g, ""), 10); if(n > max) max = n; });
      return "REQ-" + (max + 1);
    },

    /* ---- completed services (tech → CEO, live) ---- */
    completions: cread,
    addCompletion: function(rec){
      var l = cread();
      rec.at = rec.at || Date.now();
      rec.cid = rec.cid || ("C" + rec.at + "-" + Math.random().toString(36).slice(2,6));
      l.unshift(rec);                 // newest first
      cwrite(l);
      ping({ type:"completion", rec:rec });
      return rec;
    },
    clearCompletions: function(){ cwrite([]); ping({ type:"clear" }); },
    seedCompletions: function(list){ if(cread().length) return false; cwrite(list); return true; }, // demo data, only when empty

    /* ---- live updates: fires cb() whenever a completion is added/cleared ---- */
    onLive: function(cb){
      if(BC) BC.addEventListener("message", function(e){ cb(e.data || {}); });
      window.addEventListener("storage", function(e){ if(e.key === CKEY) cb({ type:"storage" }); });
    }
  };
})();
