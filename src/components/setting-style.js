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
        this.deleteTxt = '';
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
        // 替换文本元素
        this.replaceNodes(classname);
        // 合并相邻元素
        this.merge();
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
                if(selections[i].className === 'selection active') {
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
            class: className + ' active'
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

        range.applyInlineStyle('i', {
            class: classname + ' delete'
        });

        let deleteNode = document.getElementsByClassName('delete');

        for(let i=0; i<deleteNode.length; i++) {
            this.deleteTxt = '';
            this.childNodeToText(deleteNode[i]);
            this.replaceHTML(deleteNode[i].parentNode, this.node2string(deleteNode[i]), this.deleteTxt);
        }
    }

    // 获取range
    range() {
        let getRange = () => {
            let me = window;
            let range = new Range(me.document);
            
            let sel = window.getSelection();
            
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
    replaceNodes(classname = ''){

        let els = document.getElementsByClassName('active');

        for(let i = 0; i < els.length; i++) {
            let elParent = els[i].parentNode;
            let elChildren = els[i].children;
            let elClass = els[i].className.replace(' active', '');
            let elParentClass = elParent.className.replace(' active', '');
            

            if(elChildren.length === 0) { 
                // 没有子节点
                if(ACTION_TYPE.indexOf(elParentClass) !== -1) {
                    // 父节点包括波浪线直线等替换方式
                    this.replaceChildren(elParent.parentNode, els[i].parentNode);
                }else {
                    // 父节点不包含波浪线直线等替换方式
                    this.replaceHTML(elParent, this.node2string(els[i]), `<i class = "${elClass}">${els[i].innerHTML}</i>`);
                }
            }else {
                // 子节点替换
                for(let j = 0; j < elChildren.length; j++) {
                    this.replaceChildren(elChildren[j].parentNode.parentNode, elChildren[j].parentNode);
                }
            }
        }
        
        // 清空选中的数据
        this.clearSelection();
    }

    // 合并相邻的相同class元素
    merge() {
        ACTION_TYPE.forEach(it => {
            let nodes = document.getElementsByClassName(it);

            for(let i = 0; i < nodes.length; i++) {
                this.replaceNodeContent(nodes[i].parentNode, it);
            }
        })
    }

    replaceNodeContent(node, classname){
        for(let i = 0; i < node.childNodes.length; i++) {
            this.replaceContent(node, classname, i);
        }
    }

    // 替换平级文本内容
    replaceContent(node, classname, index) {
        let cEl     = node.childNodes[index],
            oEl     = node.childNodes[index-1],
            nEl     = node.childNodes[index+1],
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

        node.innerHTML = node.innerHTML.replace(oContent, cContent);
    }

    // 替换子级文本内容
    replaceChildren(node, el) {
        if(el && el.childNodes.length && node) {
            let elClass = el.className;
            let content = '';
            let oContent = `<i class="${elClass}">${el.innerHTML}</i>`;
            let cClass = node.getElementsByClassName('active')[0].className.replace(' active', '');
            let newElClass = elClass.replace(' active', '');

            for(let i=0; i<el.childNodes.length; i++) {
                let child = el.childNodes[i];
                let isHtml = this.isHtml(child);

                if(isHtml){
                    content += `<i class="${cClass}">${child.innerHTML}</i>`;
                }else {
                    content += `<i class="${newElClass}">${child.data}</i>`;
                }
            }

            node.innerHTML = node.innerHTML.replace(oContent, content);
        }
    }

    // 将含有delete的类名的子节点转为text
    childNodeToText(nodes) {
        if(nodes) {
            for(let i = 0; i<nodes.childNodes.length; i++){
                if(this.isHtml(nodes.childNodes[i])) {
                    this.childNodeToText(nodes.childNodes[i]);
                }else {
                    // 设置替换的文字
                    this.setDeleteTxt(nodes.childNodes[i].data)
                }
            }
        }
    }

    // 设置替换后的文字
    setDeleteTxt(text) {
        this.deleteTxt += text;
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
