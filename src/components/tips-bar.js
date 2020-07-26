import { h } from './element';

class TipsBar{
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
                })

                arr.push(el);
            }
        }

        // 保存操作栏
        this.children = [...arr];

        return arr;
    }

    // 获取tips
    getTips() {
        let tips = h('div', 'tips');

        tips.children(...this.create());

        return tips.el;
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

    // 按钮点击事件
    clickEvent(key) {
        this.cb(key);
    }

    // 开始选中的位置
    setStartPos(e) {
        this.hide();

        this.position = {
            x: e.clientX,
            y: e.clientY
        }
    }

    // 设置位置
    setEndPos(e, sel) {
        let wrapEl = document.getElementById('weread');
        // 起始位置
        const { x, y } = this.position;
        // 结束位置
        const _x = e.clientX, _y = e.clientY;
        let left, top = e.target.offsetTop;

        this.show();

        // tips宽度
        let tipsW = this.el.clientWidth || this.el.offsetWidth;
        // 容器宽度
        let wrapW = wrapEl.clientWidth || wrapEl.offsetWidth;

        left = Math.min(x, _x);
        top = Math.min(y, _y);

        // if(Math.abs(x - _x) < tipsW) {
        //     left = left + (Math.abs(x - _x) / 2) - (tipsW / 2);
        // }else if(){

        // }

        this.css({
            left: left - wrapEl.offsetLeft + 'px',
            top: top - 100 + 'px'
        });
    }
}

export {
    TipsBar
}