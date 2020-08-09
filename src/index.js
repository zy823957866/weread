import { h } from './components/element';
import { TipsBar } from './components/tips-bar';
import { Message } from './components/message';
import { SettingStyle } from './components/setting-style';
import { SelectionActions } from './components/selection-actions';
import { WriteIdea } from './components/write-idea';

// css样式
import './index.less';

// 阻止事件的类型[貌似不生效]
const useLessEventName = ['oncontextmenu'];

class Weread {
    constructor(
        selectors,
        data
    ){
        let targetEl = selectors;
        this.data    = data;

        
        
        if(typeof selectors === 'string') {
            targetEl = document.querySelector(selectors);
        }

        // 创建内容区域
        const wrapContent = this.render(data.data);
        const rootEl = h('div', 'weread');
        const rootElChildren = rootEl.children(wrapContent.title, wrapContent.content);
        // 添加文本内容
        targetEl.appendChild(rootElChildren);

        
        // 设置tooltip
        this.tooltip = new Message();
        // 添加tooltip
        targetEl.appendChild(this.tooltip.create());
        
        // 设置样式
        this.settingStyle = new SettingStyle(this.tooltip);

        // 创建tips
        this.tipsBar = new TipsBar(data.tips, (e) => {
            this.settingStyle[e]();
        });
        
        // 默认隐藏tips
        this.tipsBar.hide();
        targetEl.appendChild(this.tipsBar.el.el);


        // 操作选中的内容选中的内容
        this.selectionActions = new SelectionActions(this.settingStyle, this.tipsBar);

        // 设置评论
        this.writeIdea = new WriteIdea();
        targetEl.appendChild(this.writeIdea.render())


        this.mouseEvent(rootEl);
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
        // 阻止右键
        document.oncontextmenu = function() { return false; }

        // 取消冒泡
        target.on(event, (e) => {
            e = e || window.event;
            e.cancelBubble = true;
            e.stopPropagation();
        })
    }

    // 鼠标事件
    mouseEvent(target) {
        // 鼠标放开
        target.on('mouseup', (e) => {
            this.endSelect(e);
        });

        // 鼠标按下
        target.on('mousedown', (e) => {
            this.startSelect(e);
        });

        // 单击容器
        target.on('click', (e) => {
            this.selectionActions.clickStyle(e);
        });
    }

    // 选中事件
    endSelect(e) {
        e = e || window.event;

        let sel = window.getSelection();
        let self = this;
        
        if(sel && sel.rangeCount) {
            if(!sel.isCollapsed && sel.toString().trim().length) {
                // 为选中的内容添加weread_selection 类名
                this.settingStyle.selection('selection', function() {
                    self.tipsBar.tipsPos(e);
                });
            }
        }
    }

    // 开始选择
    startSelect(e) {
        e = e || window.event;

        let self = this;
        this.tipsBar.setStartPos(e,function() {
            self.settingStyle.destroySelection();
        });
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