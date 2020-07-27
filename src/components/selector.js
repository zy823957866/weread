import dtd from './dtd.js';
import utils from './utils.js'

// 跟新闭合状态
function updateCollapse(range) {
    range.collapsed =
    range.startContainer &&
    range.endContainer &&
    range.startContainer === range.endContainer &&
    range.startOffset == range.endOffset;
  }

// 获取索引
function getNodeIndex(node, ignoreTextNode) {
    let preNode = node, i = 0;

    while ((preNode = preNode.previousSibling)) {
        if (ignoreTextNode && preNode.nodeType == 3) {
            if (preNode.nodeType != preNode.nextSibling.nodeType) {
                i++;
            }
            continue;
        }
        i++;
    }
    return i;
}

function setEndPoint(toStart, node, offset, range) {
    //如果node是自闭合标签要处理
    if ( node.nodeType == 1 &&
        (dtd.$empty[node.tagName] || dtd.$nonChild[node.tagName])
    ) {
        offset = getNodeIndex(node) + (toStart ? 0 : 1);
        node = node.parentNode;
    }

    if (toStart){
        range.startContainer = node;
        range.startOffset = offset;
        if (!range.endContainer) {
          range.collapse(true);
        }
    }else {
        range.endContainer = node;
        range.endOffset = offset;
        if (!range.startContainer) {
          range.collapse(false);
        }
    }

    updateCollapse(range);

    return range;
}

class Selector{
    constructor() {
        this.selector = {};
        this.startContainer = this.startOffset = this.endContainer = this.endOffset = null;
        this.collapsed = true;
    }

    // 设置起始容器和偏移量
    setStart(node, offset) {
        return setEndPoint(true, node, offset, this);
    }

    // 设置结束容器和偏移量
    setEnd(node, offset) {
        return setEndPoint(false, node, offset, this);
    }

    /**
     * 闭合当前选区，根据给定的toStart参数项决定是向当前选区开始处闭合还是向结束处闭合，
     * 如果toStart的值为true，则向开始位置闭合， 反之，向结束位置闭合。
    */
    collapse(toStart) {
        if (toStart) {
            this.endContainer = this.startContainer;
            this.endOffset = this.startOffset;
        }else {
            this.startContainer = this.endContainer;
            this.startOffset = this.endOffset;
        }

        this.collapsed = true;
        return this;
    }

    // 添加i标签设置样式
    applyStyle(tagName, attrs, type){
        if (this.collapsed) return this;

        this.trimBoundary().enlarge(false, function (node) {
            return node.nodeType == 1 && domUtils.isBlockElm(node);
        }).adjustmentBoundary();
    }

    /**
     * 调整当前Range的开始和结束边界容器，如果是容器节点是文本节点,就调整到包含该文本节点的父节点上
     * 该操作有可能会引起文本节点被切开
    */
    trimBoundary() {
        this.txtToElmBoundary();

        let start       = this.startContainer,
            offset      = this.startOffset,
            collapsed   = this.collapsed,
            end         = this.endContainer;

        if (start.nodeType == 3) {
            if (offset == 0) {
                this.setStartBefore(start);
            } else {
                if (offset >= start.nodeValue.length) {
                    this.setStartAfter(start);
                } else {
                    let textNode = domUtils.split(start, offset);

                    //跟新结束边界
                    if (start === end) {
                        this.setEnd(textNode, this.endOffset - offset);
                    } else if (start.parentNode === end) {
                        this.endOffset += 1;
                    }

                    this.setStartBefore(textNode);
                }
            }

            if (collapsed) {
                return this.collapse(true);
            }
        }

        if (!ignoreEnd) {
            offset  = this.endOffset;
            end     = this.endContainer;

            if (end.nodeType == 3) {
                if (offset == 0) {
                    this.setEndBefore(end);
                } else {
                    offset < end.nodeValue.length && domUtils.split(end, offset);
                    this.setEndAfter(end);
                }
            }
        }

        return this;
    }

    /**
     * 如果选区在文本的边界上，就扩展选区到文本的父节点上, 如果当前选区是闭合的， 则根据参数项
     * ignoreCollapsed 的值决定是否执行该调整
     */
    txtToElmBoundary(ignoreCollapsed) {
        let adjust = (r, c) => {
            let container = r[c + "Container"], offset = r[c + "Offset"];

            if (container.nodeType == 3) {
                if (!offset) {
                    r[
                        "set" +
                        c.replace(/(\w)/, function (a) {
                        return a.toUpperCase();
                        }) +
                        "Before"
                    ](container);
                } else if (offset >= container.nodeValue.length) {
                    r[
                        "set" +
                        c.replace(/(\w)/, function (a) {
                        return a.toUpperCase();
                        }) +
                        "After"
                    ](container);
                }
            }
        }

        if (ignoreCollapsed || !this.collapsed) {
            adjust(this, "start");
            adjust(this, "end");
        }

        return this;
    }

    // 检测node节点是否为body节点
    isBody(node) {
        return node && node.nodeType == 1 && node.tagName.toLowerCase() == "body";
    }

    // 检查节点node是否为block元素
    isBlockElm(node) {
        return (
            node.nodeType == 1 &&
            (dtd.$block[node.tagName] || styleBlock[this.getComputedStyle(node, "display")]) &&
            !dtd.$nonChild[node.tagName]
        );
    }

    // 扩大选择范围
    enlarge(toBlock, stopFn) {
        let isBody = this.isBody(),
            pre,
            node,
            tmp = document.createTextNode("");
      
        if (toBlock) {
            node = this.startContainer;
            if (node.nodeType == 1) {
                if (node.childNodes[this.startOffset]) {
                    pre = node = node.childNodes[this.startOffset];
                } else {
                    node.appendChild(tmp);
                    pre = node = tmp;
                }
            } else {
                pre = node;
            }

            while (1) {
                if (this.isBlockElm(node)) {
                    node = pre;
                    while ((pre = node.previousSibling) && !this.isBlockElm(pre)) {
                        node = pre;
                    }
                    this.setStartBefore(node);
                    break;
                }
                pre = node;
                node = node.parentNode;
            }
            node = this.endContainer;

            if (node.nodeType == 1) {
                if ((pre = node.childNodes[this.endOffset])) {
                    node.insertBefore(tmp, pre);
                } else {
                    node.appendChild(tmp);
                }
                pre = node = tmp;
            } else {
                pre = node;
            }

            while (1) {
                if (this.isBlockElm(node)) {
                    node = pre;
                    while ((pre = node.nextSibling) && !this.isBlockElm(pre)) {
                        node = pre;
                    }
                    this.setEndAfter(node);
                    break;
                }
                pre = node;
                node = node.parentNode;
            }

            if (tmp.parentNode === this.endContainer) {
                this.endOffset--;
            }

            domUtils.remove(tmp);
        }
  
        // 扩展边界到最大
        if (!this.collapsed) {
            while (this.startOffset == 0) {
                if (stopFn && stopFn(this.startContainer)) {
                    break;
                }
                if (isBody(this.startContainer)) {
                    break;
                }
                this.setStartBefore(this.startContainer);
            }

            while (
            this.endOffset == (this.endContainer.nodeType == 1
                ? this.endContainer.childNodes.length
                : this.endContainer.nodeValue.length)
            ) {
                if (stopFn && stopFn(this.endContainer)) {
                    break;
                }
                if (isBody(this.endContainer)) {
                    break;
                }
                this.setEndAfter(this.endContainer);
            }
        }

        return this;
    }

    // 获取元素element经过计算后的样式值
    getComputedStyle(element, styleName) {
        // 一下的属性单独处理
        let pros = "width height top left";

        if (pros.indexOf(styleName) > -1) {
            return (element[
                "offset" +
                styleName.replace(/^\w/, function (s) {
                return s.toUpperCase();
            })] + "px");
        }

        // 忽略文本节点
        if (element.nodeType == 3) {
            element = element.parentNode;
        }
        try {
            var value = this.getStyle(element, styleName) || (window.getComputedStyle ? window.getComputedStyle(element, "").getPropertyValue(styleName)
                        : (element.currentStyle || element.style)[
                        utils.cssStyleToDomStyle(styleName)
            ]);
        } catch (e) {
            return "";
        }

        return utils.transUnitToPx(utils.fixColor(styleName, value));
    }

    // 将Range结束位置设置到node节点之后
    setEndAfter(node) {
        return this.setEnd(node.parentNode, this.getNodeIndex(node) + 1);
    }

}

export {
    Selector
}