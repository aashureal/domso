// domso.js - IIFE version exporting global `DOM`
(function (global) {
  // ------- Mutation Queue & Runner -------
  const mutationQueue = [];
  function queueMutation(fn) {
    mutationQueue.push(fn);
  }
  function runQueue() {
    while (mutationQueue.length) {
      const fn = mutationQueue.shift();
      fn();
    }
  }
  // Auto-flush on animation frame
  (function scheduleFlush() {
    requestAnimationFrame(() => {
      runQueue();
      scheduleFlush();
    });
  })();

  // ------- DOMElement Class -------
  function DOMElement(el) {
    this.el = el;
  }
  DOMElement.prototype.style = function (styles) {
    queueMutation(() => Object.assign(this.el.style, styles));
    return this;
  };
  DOMElement.prototype.addClass = function (...classes) {
    queueMutation(() => this.el.classList.add(...classes));
    return this;
  };
  DOMElement.prototype.removeClass = function (...classes) {
    queueMutation(() => this.el.classList.remove(...classes));
    return this;
  };
  DOMElement.prototype.attr = function (attrs) {
    queueMutation(() => {
      for (let k in attrs) this.el.setAttribute(k, attrs[k]);
    });
    return this;
  };
  DOMElement.prototype.text = function (str) {
    queueMutation(() => {
      this.el.textContent = str;
    });
    return this;
  };
  DOMElement.prototype.html = function (str) {
    queueMutation(() => {
      this.el.innerHTML = str;
    });
    return this;
  };
  DOMElement.prototype.on = function (evt, handler) {
    this.el.addEventListener(evt, handler);
    return this;
  };
  DOMElement.prototype.off = function (evt, handler) {
    this.el.removeEventListener(evt, handler);
    return this;
  };
  DOMElement.prototype.append = function (child) {
    queueMutation(() =>
      this.el.appendChild(child instanceof DOMElement ? child.el : child)
    );
    return this;
  };
  DOMElement.prototype.remove = function () {
    queueMutation(() => {
      this.el.parentNode && this.el.parentNode.removeChild(this.el);
    });
    return this;
  };
  DOMElement.prototype.parent = function () {
    return this.el.parentElement ? new DOMElement(this.el.parentElement) : null;
  };
  DOMElement.prototype.children = function () {
    return Array.from(this.el.children).map((e) => new DOMElement(e));
  };
  DOMElement.prototype.find = function (sel) {
    const found = this.el.querySelector(sel);
    return found ? new DOMElement(found) : null;
  };

  // ------- Main DOM API -------
  const DOM = {
    create(tag, props = {}, children = []) {
      const el = document.createElement(tag);
      const wrapped = new DOMElement(el);
      if (props.class) wrapped.addClass(...props.class.split(" "));
      if (props.text != null) wrapped.text(props.text);
      if (props.html != null) wrapped.html(props.html);
      if (props.attr) wrapped.attr(props.attr);
      if (props.style) wrapped.style(props.style);
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        wrapped.append(
          typeof c === "string"
            ? document.createTextNode(c)
            : c instanceof DOMElement
            ? c.el
            : c
        );
      });
      return wrapped;
    },

    select(selector) {
      const el = document.querySelector(selector);
      return el ? new DOMElement(el) : null;
    },

    selectAll(selector) {
      return Array.from(document.querySelectorAll(selector)).map(
        (el) => new DOMElement(el)
      );
    },

    byId(id) {
      const el = document.getElementById(id);
      return el ? new DOMElement(el) : null;
    },

    byClass(className) {
      return this.selectAll(`.${className}`);
    },
  };

  // Expose globally
  global.DOM = DOM;
})(window);
