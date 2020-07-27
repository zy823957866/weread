import browser from './browser.js';
import utils from './utils.js';
import dtd from './dtd.js';

function getDomNode(node, start, ltr, startFromChild, fn, guard) {
	var tmpNode = startFromChild && node[start],
		parent;
	!tmpNode && (tmpNode = node[ltr]);
	while (!tmpNode && (parent = (parent || node).parentNode)) {
		if (parent.tagName == "BODY" || (guard && !guard(parent))) {
			return null;
		}
		tmpNode = parent[ltr];
	}
	if (tmpNode && fn && !fn(tmpNode)) {
		return getDomNode(tmpNode, start, ltr, false, fn);
	}
	return tmpNode;
}
var attrFix = {
	tabindex: "tabIndex",
	readonly: "readOnly"
},
	styleBlock = utils.listToMap([
		"-webkit-box",
		"-moz-box",
		"block",
		"list-item",
		"table",
		"table-row-group",
		"table-header-group",
		"table-footer-group",
		"table-row",
		"table-column-group",
		"table-column",
		"table-cell",
		"table-caption"
	]);

var domUtils = ({
	//节点常量
	NODE_ELEMENT: 1,
	NODE_DOCUMENT: 9,
	NODE_TEXT: 3,
	NODE_COMMENT: 8,
	NODE_DOCUMENT_FRAGMENT: 11,

	//位置关系
	POSITION_IDENTICAL: 0,
	POSITION_DISCONNECTED: 1,
	POSITION_FOLLOWING: 2,
	POSITION_PRECEDING: 4,
	POSITION_IS_CONTAINED: 8,
	POSITION_CONTAINS: 16,
	//ie6使用其他的会有一段空白出现
	fillChar: "\u200B",
	//-------------------------Node部分--------------------------------
	keys: {
		8: 1,	/*Backspace*/ 
		46: 1,	/*Delete*/
		16: 1,  /*Shift*/
		17: 1,  /*Ctrl*/
		18: 1,  /*Alt*/
		37: 1,
		38: 1,
		39: 1,
		40: 1,
		13: 1 	/*enter*/
	},

	// 获取节点A相对于节点B的位置关系
	getPosition: function (nodeA, nodeB) {
		// 如果两个节点是同一个节点
		if (nodeA === nodeB) {
			return 0;
		}
		var node,
			parentsA = [nodeA],
			parentsB = [nodeB];
		node = nodeA;
		while ((node = node.parentNode)) {
			// 如果nodeB是nodeA的祖先节点
			if (node === nodeB) {
				return 10;
			}
			parentsA.push(node);
		}
		node = nodeB;
		while ((node = node.parentNode)) {
			// 如果nodeA是nodeB的祖先节点
			if (node === nodeA) {
				return 20;
			}
			parentsB.push(node);
		}
		parentsA.reverse();
		parentsB.reverse();
		if (parentsA[0] !== parentsB[0]) {
			return 1;
		}
		var i = -1;
		while ((i++, parentsA[i] === parentsB[i])) { }
		nodeA = parentsA[i];
		nodeB = parentsB[i];
		while ((nodeA = nodeA.nextSibling)) {
			if (nodeA === nodeB) {
				return 4;
			}
		}

		return 2;
	},

	// 检测节点node在父节点中的索引位置
	getNodeIndex: function (node, ignoreTextNode) {
		var preNode = node,
			i = 0;
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
	},

	// 检测节点node是否在给定的document对象上
	inDoc: function (node, doc) {
		return domUtils.getPosition(node, doc) == 10;
	},

	// 根据给定的过滤规则filterFn， 查找符合该过滤规则的node节点的第一个祖先节点
	findParent: function (node, filterFn, includeSelf) {
		if (node && !domUtils.isBody(node)) {
			node = includeSelf ? node : node.parentNode;
			while (node) {
				if (!filterFn || filterFn(node) || domUtils.isBody(node)) {
					return filterFn && !filterFn(node) && domUtils.isBody(node)
						? null
						: node;
				}
				node = node.parentNode;
			}
		}
		return null;
	},

	// 查找node的节点名为tagName的第一个祖先节点， 查找的起点是node节点的父节点。
	findParentByTagName: function (node, tagNames, includeSelf, excludeFn) {
		tagNames = utils.listToMap(utils.isArray(tagNames) ? tagNames : [tagNames]);
		return domUtils.findParent(
			node,
			function (node) {
				return tagNames[node.tagName] && !(excludeFn && excludeFn(node));
			},
			includeSelf
		);
	},

	// 查找节点node的祖先节点集合， 查找的起点是给定节点的父节点，结果集中不包含给定的节点。
	findParents: function (node, includeSelf, filterFn, closerFirst) {
		var parents = includeSelf && ((filterFn && filterFn(node)) || !filterFn)
			? [node]
			: [];
		while ((node = domUtils.findParent(node, filterFn))) {
			parents.push(node);
		}
		return closerFirst ? parents : parents.reverse();
	},

	// 在节点node后面插入新节点newNode
	insertAfter: function (node, newNode) {
		return node.nextSibling
			? node.parentNode.insertBefore(newNode, node.nextSibling)
			: node.parentNode.appendChild(newNode);
	},

	// 删除节点node及其下属的所有节点
	remove: function (node, keepChildren) {
		var parent = node.parentNode,
			child;
		if (parent) {
			if (keepChildren && node.hasChildNodes()) {
				while ((child = node.firstChild)) {
					parent.insertBefore(child, node);
				}
			}
			parent.removeChild(node);
		}
		return node;
	},

	// 取得node节点的下一个兄弟节点， 如果该节点其后没有兄弟节点， 则递归查找其父节点之后的第一个兄弟节点
	getNextDomNode: function (node, startFromChild, filterFn, guard) {
		return getDomNode(
			node,
			"firstChild",
			"nextSibling",
			startFromChild,
			filterFn,
			guard
		);
	},

	// 检测节点node是否属是UEditor定义的bookmark节点
	isBookmarkNode: function (node) {
		return node.nodeType == 1 && node.id && /^_baidu_bookmark_/i.test(node.id);
	},

	// 清除node节点左右连续为空的兄弟inline节点
	clearEmptySibling: function (node, ignoreNext, ignorePre) {
		function clear(next, dir) {
			var tmpNode;
			while (
				next &&
				!domUtils.isBookmarkNode(next) &&
				(domUtils.isEmptyInlineElement(next) ||
					//这里不能把空格算进来会吧空格干掉，出现文字间的空格丢掉了
					!new RegExp("[^\t\n\r" + domUtils.fillChar + "]").test(
						next.nodeValue
					))
			) {
				tmpNode = next[dir];
				domUtils.remove(next);
				next = tmpNode;
			}
		}
		!ignoreNext && clear(node.nextSibling, "nextSibling");
		!ignorePre && clear(node.previousSibling, "previousSibling");
	},

	// 将一个文本节点textNode拆分成两个文本节点，offset指定拆分位置
	split: function (node, offset) {
		var doc = node.ownerDocument;
		if (browser.ie && offset == node.nodeValue.length) {
			var next = doc.createTextNode("");
			return domUtils.insertAfter(node, next);
		}
		var retval = node.splitText(offset);
		return retval;
	},

	// 检测文本节点textNode是否为空节点（包括空格、换行、占位符等字符）
	isWhitespace: function (node) {
		return !new RegExp("[^ \t\n\r" + domUtils.fillChar + "]").test(
			node.nodeValue
		);
	},
	// 比较节点nodeA与节点nodeB是否具有相同的标签名、属性名以及属性值
	isSameElement: function (nodeA, nodeB) {
		if (nodeA.tagName != nodeB.tagName) {
			return false;
		}
		var thisAttrs = nodeA.attributes,
			otherAttrs = nodeB.attributes;
		if (!browser.ie && thisAttrs.length != otherAttrs.length) {
			return false;
		}
		var attrA,
			attrB,
			al = 0,
			bl = 0;
		for (var i = 0; (attrA = thisAttrs[i++]);) {
			if (attrA.nodeName == "style") {
				if (attrA.specified) {
					al++;
				}
				if (domUtils.isSameStyle(nodeA, nodeB)) {
					continue;
				} else {
					return false;
				}
			}
			if (browser.ie) {
				if (attrA.specified) {
					al++;
					attrB = otherAttrs.getNamedItem(attrA.nodeName);
				} else {
					continue;
				}
			} else {
				attrB = nodeB.attributes[attrA.nodeName];
			}
			if (!attrB.specified || attrA.nodeValue != attrB.nodeValue) {
				return false;
			}
		}
		// 有可能attrB的属性包含了attrA的属性之外还有自己的属性
		if (browser.ie) {
			for (i = 0; (attrB = otherAttrs[i++]);) {
				if (attrB.specified) {
					bl++;
				}
			}
			if (al != bl) {
				return false;
			}
		}
		return true;
	},

	// 判断节点nodeA与节点nodeB的元素的style属性是否一致
	isSameStyle: function (nodeA, nodeB) {
		var styleA = nodeA.style.cssText
			.replace(/( ?; ?)/g, ";")
			.replace(/( ?: ?)/g, ":"),
			styleB = nodeB.style.cssText
				.replace(/( ?; ?)/g, ";")
				.replace(/( ?: ?)/g, ":");
		if (browser.opera) {
			styleA = nodeA.style;
			styleB = nodeB.style;
			if (styleA.length != styleB.length) return false;
			for (var p in styleA) {
				if (/^(\d+|csstext)$/i.test(p)) {
					continue;
				}
				if (styleA[p] != styleB[p]) {
					return false;
				}
			}
			return true;
		}
		if (!styleA || !styleB) {
			return styleA == styleB;
		}
		styleA = styleA.split(";");
		styleB = styleB.split(";");
		if (styleA.length != styleB.length) {
			return false;
		}
		for (var i = 0, ci; (ci = styleA[i++]);) {
			if (utils.indexOf(styleB, ci) == -1) {
				return false;
			}
		}
		return true;
	},

	// 检查节点node是否为block元素
	isBlockElm: function (node) {
		return (
			node.nodeType == 1 &&
			(dtd.$block[node.tagName] ||
				styleBlock[domUtils.getComputedStyle(node, "display")]) &&
			!dtd.$nonChild[node.tagName]
		);
	},

	// 检测node节点是否为body节点
	isBody: function (node) {
		return node && node.nodeType == 1 && node.tagName.toLowerCase() == "body";
	},

	// 检查节点node是否是空inline节点
	isEmptyInlineElement: function (node) {
		if (node.nodeType != 1 || !dtd.$removeEmpty[node.tagName]) {
			return 0;
		}
		node = node.firstChild;
		while (node) {
			//如果是创建的bookmark就跳过
			if (domUtils.isBookmarkNode(node)) {
				return 0;
			}
			if (
				(node.nodeType == 1 && !domUtils.isEmptyInlineElement(node)) ||
				(node.nodeType == 3 && !domUtils.isWhitespace(node))
			) {
				return 0;
			}
			node = node.nextSibling;
		}
		return 1;
	},

	// 删除node节点下首尾两端的空白文本子节点
	trimWhiteTextNode: function (node) {
		function remove(dir) {
			var child;
			while (
				(child = node[dir]) &&
				child.nodeType == 3 &&
				domUtils.isWhitespace(child)
			) {
				node.removeChild(child);
			}
		}
		remove("firstChild");
		remove("lastChild");
	},

	// 合并node节点下相同的子节点
	mergeChild: function (node, tagName, attrs) {
		var list = domUtils.getElementsByTagName(node, node.tagName.toLowerCase());
		for (var i = 0, ci; (ci = list[i++]);) {
			if (!ci.parentNode || domUtils.isBookmarkNode(ci)) {
				continue;
			}
			//span单独处理
			if (ci.tagName.toLowerCase() == "span") {
				if (node === ci.parentNode) {
					domUtils.trimWhiteTextNode(node);
					if (node.childNodes.length == 1) {
						node.style.cssText = ci.style.cssText + ";" + node.style.cssText;
						domUtils.remove(ci, true);
						continue;
					}
				}
				ci.style.cssText = node.style.cssText + ";" + ci.style.cssText;
				if (attrs) {
					var style = attrs.style;
					if (style) {
						style = style.split(";");
						for (var j = 0, s; (s = style[j++]);) {
							ci.style[utils.cssStyleToDomStyle(s.split(":")[0])] = s.split(
								":"
							)[1];
						}
					}
				}
				if (domUtils.isSameStyle(ci, node)) {
					domUtils.remove(ci, true);
				}
				continue;
			}
			if (domUtils.isSameElement(node, ci)) {
				domUtils.remove(ci, true);
			}
		}
	},

	// 原生方法getElementsByTagName的封装
	getElementsByTagName: function (node, name, filter) {
		if (filter && utils.isString(filter)) {
			var className = filter;
			filter = function (node) {
				return domUtils.hasClass(node, className);
			};
		}
		name = utils.trim(name).replace(/[ ]{2,}/g, " ").split(" ");
		var arr = [];
		for (var n = 0, ni; (ni = name[n++]);) {
			var list = node.getElementsByTagName(ni);
			for (var i = 0, ci; (ci = list[i++]);) {
				if (!filter || filter(ci)) arr.push(ci);
			}
		}

		return arr;
	},

	mergeToParent: function (node) {
		var parent = node.parentNode;
		while (parent && dtd.$removeEmpty[parent.tagName]) {
			if ((parent.tagName == node.tagName && parent.className == node.className) || parent.tagName == "A") {
				//针对a标签单独处理
				domUtils.trimWhiteTextNode(parent);
				//span需要特殊处理  不处理这样的情况 <span stlye="color:#fff">xxx<span style="color:#ccc">xxx</span>xxx</span>
				if (
					(parent.tagName == "SPAN" && !domUtils.isSameStyle(parent, node)) ||
					(parent.tagName == "A" && node.tagName == "SPAN")
				) {
					if (parent.childNodes.length > 1 || parent !== node.parentNode) {
						node.style.cssText =
							parent.style.cssText + ";" + node.style.cssText;
						parent = parent.parentNode;
						continue;
					} else {
						parent.style.cssText += ";" + node.style.cssText;
						//trace:952 a标签要保持下划线
						if (parent.tagName == "A") {
							parent.style.textDecoration = "underline";
						}
					}
				}
				if (parent.tagName != "A") {
					parent === node.parentNode && domUtils.remove(node, true);
					break;
				}
			}
			parent = parent.parentNode;
		}
	},

	mergeSibling: function (node, ignorePre, ignoreNext) {
		function merge(rtl, start, node) {
			var next;
			if (
				(next = node[rtl]) &&
				!domUtils.isBookmarkNode(next) &&
				next.nodeType == 1 &&
				domUtils.isSameElement(node, next)
			) {
				while (next.firstChild) {
					if (start == "firstChild") {
						node.insertBefore(next.lastChild, node.firstChild);
					} else {
						node.appendChild(next.firstChild);
					}
				}
				domUtils.remove(next);
			}
		}
		!ignorePre && merge("previousSibling", "firstChild", node);
		!ignoreNext && merge("nextSibling", "lastChild", node);
	},

	// 设置节点node及其子节点不会被选中
	unSelectable: browser.opera
		? function (node) {
			//for ie9
			node.onselectstart = function () {
				return false;
			};
			node.onclick = node.onkeyup = node.onkeydown = function () {
				return false;
			};
			node.unselectable = "on";
			node.setAttribute("unselectable", "on");
			for (var i = 0, ci; (ci = node.all[i++]);) {
				switch (ci.tagName.toLowerCase()) {
					case "iframe":
					case "textarea":
					case "input":
					case "select":
						break;
					default:
						ci.unselectable = "on";
						node.setAttribute("unselectable", "on");
				}
			}
		}
		: function (node) {
			node.style.MozUserSelect = node.style.webkitUserSelect = node.style.msUserSelect = node.style.KhtmlUserSelect =
				"none";
		},

	// 在doc下创建一个标签名为tag，属性为attrs的元素
	createElement: function (doc, tag, attrs) {
		return domUtils.setAttributes(doc.createElement(tag), attrs);
	},

	// 为节点node添加属性attrs，attrs为属性键值对
	setAttributes: function (node, attrs) {
		for (var attr in attrs) {
			if (attrs.hasOwnProperty(attr)) {
				var value = attrs[attr];
				switch (attr) {
					case "class":
						//ie下要这样赋值，setAttribute不起作用
						node.className = value;
						break;
					case "style":
						node.style.cssText = node.style.cssText + ";" + value;
						break;
					case "innerHTML":
						node[attr] = value;
						break;
					case "value":
						node.value = value;
						break;
					default:
						node.setAttribute(attrFix[attr] || attr, value);
				}
			}
		}
		return node;
	},

	// 获取元素element经过计算后的样式值
	getComputedStyle: function (element, styleName) {
		//一下的属性单独处理
		var pros = "width height top left";

		if (pros.indexOf(styleName) > -1) {
			return (
				element[
				"offset" +
				styleName.replace(/^\w/, function (s) {
					return s.toUpperCase();
				})
				] + "px"
			);
		}
		//忽略文本节点
		if (element.nodeType == 3) {
			element = element.parentNode;
		}
		try {
			var value =
				domUtils.getStyle(element, styleName) ||
				(window.getComputedStyle
					? window.getComputedStyle(element, "")
						.getPropertyValue(styleName)
					: (element.currentStyle || element.style)[
					utils.cssStyleToDomStyle(styleName)
					]);
		} catch (e) {
			return "";
		}
		return utils.transUnitToPx(utils.fixColor(styleName, value));
	},

	// 判断元素element是否包含给定的样式类名className
	hasClass: function (element, className) {
		if (utils.isRegExp(className)) {
			return className.test(element.className);
		}
		className = utils.trim(className).replace(/[ ]{2,}/g, " ").split(" ");
		for (var i = 0, ci, cls = element.className; (ci = className[i++]);) {
			if (!new RegExp("\\b" + ci + "\\b", "i").test(cls)) {
				return false;
			}
		}
		return i - 1 == className.length;
	},

	// 判断给定节点是否为br
	isBr: function (node) {
		return node.nodeType == 1 && node.tagName == "BR";
	},

	// 判断给定的节点是否是一个“填充”节点
	isFillChar: function (node, isInStart) {
		if (node.nodeType != 3) return false;
		var text = node.nodeValue;
		if (isInStart) {
			return new RegExp("^" + domUtils.fillChar).test(text);
		}
		return !text.replace(new RegExp(domUtils.fillChar, "g"), "").length;
	},
});

export default domUtils;
