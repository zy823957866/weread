import { h } from './components/element';
import { TipsBar } from './components/tips-bar';
import { SettingStyle } from './components/setting-style';

// css样式
import './index.less';

// 阻止事件的类型[貌似不生效]
const useLessEventName = ['onmousedown', 'onmouseup', 'paste', 'dragstart', 'copy'];

class Weread {
    constructor(
        selectors,
        data
    ){
        let targetEl = selectors;
        
        if(typeof selectors === 'string') {
            targetEl = document.querySelector(selectors);
        }

        // 创建内容区域
        const wrapContent = this.render(data.data);
        const rootEl = h('div', 'weread');
        const rootElChildren = rootEl.children(wrapContent.title, wrapContent.content);

        // 事件
        rootEl.on('mouseup', (e) => {
            this.endSelect(e);
        })

        rootEl.on('mousedown', (e) => {
            this.startSelect(e);
        })

        // 设置样式
        this.settingStyle = new SettingStyle();

        targetEl.appendChild(rootElChildren);

        // 创建tips
        this.tipsBar = new TipsBar(data.tips, (e) => {
            this.settingStyle[e]();
        });
        
        // 隐藏tips
        this.tipsBar.hide();
        targetEl.appendChild(this.tipsBar.el);

        
    }

    // 创建内容
    render(data) {
        let title, content;
        // 创建标题
        if(data.title) {
            title = h('h2', 'title');
            title.addClass('text-center');
            title.html(data.title);
        }

        // 创建内容
        if(data.content) {
            content = h('div', 'content-wrap');
            content.html(data.content);
        }

        // 阻止事件函数
        for(let it of useLessEventName) {
            this.useless(title, it);
            this.useless(content, it);
        }

        return {
            title,
            content
        }
    }

    // 阻止事件【禁止粘贴，禁止拖拽】
    useless(target, event) {
        // 取消冒泡
        target.on(event, (e) => {
            console.log(e)
            e = e || window.event;

            e.cancelBubble = true;
            e.stopPropagation();
        })
    }

    // 选中事件
    endSelect(e) {
        e = e || window.event;

        let sel = window.getSelection();

        if(sel && sel.rangeCount) {
            if(!sel.isCollapsed) {
                // 如果有选中的内容
                this.tipsBar.setEndPos(e, sel);
            }
        }
    }

    // 开始选择
    startSelect(e) {
        e = e || window.event;
        this.tipsBar.setStartPos(e);
    }

}

const we_read = (el, data='') => new Weread(el, data);

if (window) {
  window.we_read = we_read;
}

export default Weread;
export {
    we_read
};