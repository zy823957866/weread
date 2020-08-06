import Range from './range';
import domUtils from './domUtils.js'

// 样式类型
const ACTION_TYPE = ['set-bg', 'set-wave', 'set-underline', 'set-dashed'];

class SettingStyle{
    constructor(
        tooltip
    ) { 
        this.tooltip = tooltip;
        this.activeClass = '';
    }

    // 复制信息
    copy() {
        this.tooltip.tip('已复制到剪切板');
        this.destroySelection();
    }

    // 马克笔
    underlineBg() {
        this.setProp(ACTION_TYPE[0]);
    }

    // 波浪线
    underlineHandWrite() {
        this.setProp(ACTION_TYPE[1]);
    }

    // 直线
    underlineStraight() {
        this.setProp(ACTION_TYPE[2]);
    }

    // 删除下划线
    removeUnderline() {
        this.removeStyle('select-underlineBg');
    }

    // 写想法
    review() {
        console.log('您点击了写想法');
    }

    // 查询
    query() {
        console.log('您点击了查询');
    }

    setProp(classname = '') {
        // 替换文本
        this.replaceTxt(classname);
        // 销毁选择框
        this.destroySelection();
        // 合并标签内容
        this.mergeTag(classname);
    }

    // 设置选中样式
    selection(classname, cb) {
        this.replaceTxt(classname, cb);
    }

    // 销毁
    destroySelection() {
        let selections = document.getElementsByClassName('selection');

        if(selections && selections.length) {
            for(let i = 0; i < selections.length; i++) {
                if(selections[i].className === 'selection') {
                    // 如果只有selection类名 则进行销毁
                    this.replaceHTML(selections[i].parentNode, this.node2string(selections[i]), selections[i].innerHTML);
                }
            }
        }
    }

    // 文本替换页面元素
    replaceTxt(className = '', cb = function() {}) {
        let range = this.range();

        range.applyInlineStyle('i', {
            class: className
        });

        range.select();

        if(className === 'selection') {
            // 如果为选中事件，则设置
            cb();
        }
    }

    // 删除文本样式
    removeStyle(classname = '') {
        let range = this.range();

        range.removeInlineStyle('i', classname);
    }

    // 获取range
    range() {
        let getRange = () => {
            let me = window;
            let range = new Range(me.document);
            
            let sel =window.getSelection();
            
            if (sel && sel.rangeCount) {
                let firstRange = sel.getRangeAt(0);
                let lastRange = sel.getRangeAt(sel.rangeCount - 1);

            range
                .setStart(firstRange.startContainer, firstRange.startOffset)
                .setEnd(lastRange.endContainer, lastRange.endOffset);
            }
            return range;
        }

        return getRange();
    }

    // 合并相同且相邻的标签
    mergeTag(classname = ''){
        let sel = window.getSelection();

        if(sel) {
            if(sel.baseNode) {
                
                for(let i = 1; i < sel.baseNode.childNodes.length; i++) {
                    this.replaceChildren(sel, 'baseNode', sel.baseNode.childNodes[i]);
                    // this.replaceContent(sel, 'baseNode', classname, i);
                }
                domUtils.mergeChild(sel.baseNode, classname)
            }

            if(sel.focusNode) {
                for(let i = 1; i < sel.focusNode.childNodes.length; i++) {
                    // this.replaceChildren(sel, 'focusNode', sel.focusNode.childNodes[i]);
                    this.replaceContent(sel, 'focusNode', classname, i);
                }
            }
        }
        

        // 清空选中的数据
        this.clearSelection();
    }

    // 替换平级文本内容
    replaceContent(sel, type, classname, index) {
        let cEl     = sel[type].childNodes[index],
            oEl     = sel[type].childNodes[index-1],
            nEl     = sel[type].childNodes[index+1],
            cClass  = cEl && cEl.className,
            oClass  = oEl && oEl.className,
            nClass  = nEl && nEl.className;

        let oContent='', cContent = '';

        if(cClass === oClass && cClass === nClass && cClass === classname) {
            oContent = `<i class="${classname}">${oEl.innerHTML}</i><i class="${classname}">${cEl.innerHTML}</i><i class="${classname}">${nEl.innerHTML}</i>`;
            cContent = `<i class="${classname}">${oEl.innerHTML}${cEl.innerHTML}${nEl.innerHTML}</i>`;
        }else if(cClass === oClass && cClass === classname) {
            oContent = `<i class="${classname}">${oEl.innerHTML}</i><i class="${classname}">${cEl.innerHTML}</i>`;
            cContent = `<i class="${classname}">${oEl.innerHTML}${cEl.innerHTML}</i>`;
        }

        sel[type].innerHTML = sel[type].innerHTML.replace(oContent, cContent);
    }

    // 替换子级文本内容
    replaceChildren(sel, type, el) {
        if(el && el.childNodes.length) {
            let elClass = el.className;
            let content = '';
            let oContent = `<i class="${elClass}">${el.innerHTML}</i>`;
            console.log(el)
            for(let i=0; i<el.childNodes.length; i++) {
                let child = el.childNodes[i];
                let isHtml = this.isHtml(child);

                if(isHtml){
                    content += `<i class="${elClass}">${child.innerHTML}</i>`;
                }else {
                    content += `<i class="${elClass}">${child.data}</i>`;
                }
            }

            sel[type].innerHTML = sel[type].innerHTML.replace(oContent, content);
        }
    }

    // 清空选中的内容
    clearSelection() {
        window.getSelection().removeAllRanges();
    }

    // 是否为html节点
    isHtml(obj) {
        let d = document.createElement("div");
        try{
            d.appendChild(obj.cloneNode(true));
            return obj.nodeType==1 ? true : false;
        }catch(e){
            return obj==window || obj==document;
        }
    }

    // node节点转为字符串
    node2string(node) {
        console.log(node)
        var tmpNode = document.createElement( "div" );
        tmpNode.appendChild( node.cloneNode( true ) );
        var str = tmpNode.innerHTML;
        tmpNode = node = null;
        return str;
    }

    // 替换文本内容
    replaceHTML(node, oldV, newV) {
        node.innerHTML = node.innerHTML.replace(oldV, newV);
    }

}

export { SettingStyle };
