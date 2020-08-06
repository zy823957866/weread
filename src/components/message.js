import { h } from './element';

class Message{
    constructor() {
        this.el = h('div', 'tooltips').el;
    }

    create() {
        return this.el;
    }

    tip(message) {
        this.el.innerHTML = message;
        this.show();
        document.execCommand("Copy");
        
        setTimeout(() => {
            this.hide();
        }, 1500);
    }

    // 设置显示
    show() {
        this.css('display', 'inline-block');
        return this;
    }

    // 设置隐藏
    hide() {
        this.css('display', 'none');
        return this;
    }

    // 设置css
    css(name, value) {
        if (value === undefined && typeof name !== 'string') {
            Object.keys(name).forEach((k) => {
                this.el.style[k] = name[k];
            });
            return this;
        }
        if (value !== undefined) {
            this.el.style[name] = value;
            return this;
        }
        return this.el.style[name];
    }
}

export {
    Message
}