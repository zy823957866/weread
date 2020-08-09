import { h } from './element';

class TipsBar {
    constructor(
        data,
        cb
    ){
        this.data = data;
        this.el = this.getTips();

        this.cb = cb;

        // 设置选中位置
        this.position = {};
    }

    // 创建tips
    create() {
        let arr = [];

        if(Array.isArray(this.data)) {
            for(let it of this.data) {
                let el = h('button', 'toolbarItem');
                el.addClass(it.key);

                let icon = h('img', 'toolbarItem_icon');
                icon.attr('src', it.icon)

                let text = h('span', 'toolbarItem_text');
                text.html(it.text);

                el.children(icon, text);

                el.on('click', (e) => {
                    // 添加selected类名
                    this.addClass(el, 'selected');

                    // 执行事件
                    this.clickEvent(it.key);

                    // 隐藏弹框
                    this.hide();
                })

                arr.push(el);
            }
        }

        arr.push(h('span', 'arrow'));

        // 保存操作栏
        this.children = [...arr];

        return arr;
    }

    // 获取tips
    getTips() {
        let tips = h('div', 'tips');

        tips.children(...this.create());

        return tips;
    }

    // 添加class
    addClass(el, classname = '') {
        for(let it of this.children) {
            this.removeClass(it, classname);
        }

        el.addClass(classname);
    }

    removeClass(el, classname = '') {
        el.removeClass(classname);
    }

    // 设置css
    css(name, value) {
        return this.el.css(name, value)
    }

    // 设置显示
    show() {
        this.el.show();
        return this;
    }

    // 设置隐藏
    hide() {
        this.el.hide();
        return this;
    }

    // 按钮点击事件
    clickEvent(key) {
        this.cb(key);
    }

    // 开始选中的位置
    setStartPos(e, cb=function() {}) {
        this.hide();

        cb();

        this.position = {
            x: e.clientX,
            y: e.clientY
        }
    }

    // 设置tips位置
    tipsPos(e) {
        let selection = document.getElementsByClassName('selection')[0];
        let wrapEl = document.getElementById('weread');
        let contentEl = document.getElementsByClassName('content-wrap')[0];

        this.show();

        // tips宽度
        let tipsW = this.getElWidth(this.el.el);
        let tipsH = this.getElHeight(this.el.el);
        // 容器宽度
        let wrapW = this.getElWidth(wrapEl);
        // selection宽度
        let selectW = this.getElWidth(selection);
        let contentW = this.getElWidth(contentEl);

        if(selection) {
            // 起始位置
            const { x } = this.position;
            // // 结束位置
            const _x = e.clientX;
            let left, top, prefixH = 10;

            left = Math.min(x, _x);
            top = selection.offsetTop - tipsH - prefixH;

            if(selectW < contentW) {
                left = left + (Math.abs(x - _x) / 2) - (tipsW / 2);
            }else {
                left = left + ((wrapW + wrapEl.offsetLeft - left - tipsW) / 2)
            }

            this.css({
                left: left - wrapEl.offsetLeft + 'px',
                top: top + 'px'
            });
        }
    }

    getElWidth(e) {
        return e && (e.clientWidth || e.offsetWidth) || 0;
    }

    getElHeight(e) {
        return e && (e.clientHeight || e.offsetHeight) || 0;
    }
}

export {
    TipsBar
}