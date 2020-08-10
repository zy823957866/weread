/***
 * 主要针对选中的数据进行处理
 * 1、已经选中的数据  点击后默认高亮
 * 2、已经选中的数据 操作类型回显等
 */

// 样式类型
const ACTION_TYPE = ['set-bg', 'set-wave', 'set-underline', 'set-dashed'];

class SelectionActions {
    constructor(
        settingStyle,
        tooltip
    ) {
        this.settingStyle = settingStyle;
        this.tooltip = tooltip;
    }


    // 点击选中的内容
    clickStyle(e) {  
        if(e.target && ACTION_TYPE.indexOf(e.target.className) !== -1) {
            setTimeout(() => {
                e.target.innerHTML = `<i class="selection active">${e.target.innerHTML}</i>`;
                this.tooltip.tipsPos(e);
    
                this.setSelection(e.target)
            });
        }
    }

    setSelection(node) {
        // 保存selection.
        let selection = window.getSelection();    
        let range = document.createRange();
        range.selectNodeContents(node);

        // 移除所有选择的内容
        selection.removeAllRanges();

        // 添加新内容
        selection.addRange(range);
    }

    
}

export { 
    SelectionActions 
};