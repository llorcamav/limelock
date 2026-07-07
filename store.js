/* LimeLock shared store — a tiny localStorage bridge used by the unified
   portal (app.html). A customer's submitted request persists here so it
   shows up in the CEO's dispatch queue and the technician's job list.
   Stands in for a real backend. */
(function(){
  "use strict";
  var KEY = "limelock_requests";
  function read(){ try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch(e){ return []; } }
  function write(list){ try { localStorage.setItem(KEY, JSON.stringify(list)); } catch(e){} }
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
    }
  };
})();
