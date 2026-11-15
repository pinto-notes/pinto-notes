// What the app gives the canvas page around it, for the page in a browser (BoardPage.tsx frames it):
// - window.amber: the note page runtime's data and store, unused by a shared board (its drawing
//   comes from the page that frames it), and the place the canvas puts _canvasCommand.
// - window.webkit.messageHandlers.amberCanvas: the canvas's messages, passed to the framing page.
// - The engine's fonts come from this site, not from amber-lib:// (the canvas sets that address
//   as it starts; here it stays /board/canvas/).
// Only the framing page of this site talks to it: messages from anywhere else are dropped.
(function () {
  "use strict";
  var ASSETS = "/board/canvas/";
  Object.defineProperty(window, "EXCALIDRAW_ASSET_PATH", { get: function () { return ASSETS; }, set: function () {}, configurable: false });
  var host = window.parent !== window ? window.parent : null;
  var origin = location.origin;
  function post(m) {
    if (!host) return;
    try { host.postMessage({ pintoCanvas: m }, origin); }
    catch (e) { try { host.postMessage({ pintoCanvas: JSON.parse(JSON.stringify(m)) }, origin); } catch (_) {} }
  }
  window.webkit = { messageHandlers: { amberCanvas: { postMessage: post } } };
  window.amber = {
    // The room the page's own controls take round the board (BoardPage.tsx: the title and avatars
    // at the top, the tools at the foot): a board opens whole and centred inside it.
    fitInsets: { top: 76, right: 24, bottom: 92, left: 24 },
    data: { values: {}, collections: {} },
    store: { set: function () { return Promise.resolve(); } },
    onChange: function () { return function () {}; },
  };
  var waiting = [];
  function run(c) {
    var amber = window.amber;
    if (amber && typeof amber._canvasCommand === "function") { amber._canvasCommand(c); return; }
    waiting.push(c);
    if (waiting.length === 1) setTimeout(function again() {
      if (typeof window.amber._canvasCommand !== "function") { setTimeout(again, 30); return; }
      var list = waiting; waiting = [];
      for (var i = 0; i < list.length; i++) window.amber._canvasCommand(list[i]);
    }, 30);
  }
  window.addEventListener("message", function (e) {
    if (e.origin !== origin || e.source !== host) return;
    var c = e.data && e.data.pintoCommand;
    if (c && typeof c === "object") run(c);
  });
  // A press on the board while the framing page has focus (after a click on its toolbar, its title,
  // anywhere): the frame takes focus first. Otherwise the focus moving mid-press ends the engine's
  // drag before it starts, and drawing a shape does nothing.
  window.addEventListener("pointerdown", function () {
    if (!document.hasFocus()) window.focus();
  }, true);
})();
