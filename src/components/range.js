import browser from './browser.js';
import utils from './utils.js'
import dtd from './dtd.js'
import domUtils from './domUtils.js'

var fillCharReg = new RegExp(domUtils.fillChar, "g");

var guid = 0,
	fillChar = domUtils.fillChar,
	fillData;

// 更新range的collapse状态
function updateCollapse(range) {
	range.collapsed =
		range.startContainer &&
		range.endContainer &&
		range.startContainer === range.endContainer &&
		range.startOffset == range.endOffset;
}

function selectOneNode(rng) {
	return (
		!rng.collapsed &&
		rng.startContainer.nodeType == 1 &&
		rng.startContainer === rng.endContainer &&
		rng.endOffset - rng.startOffset == 1
	);
}

function setEndPoint(toStart, node, offset, range) {
	//如果node是自闭合标签要处理
	if (
		node.nodeType == 1 &&
		(dtd.$empty[node.tagName] || dtd.$nonChild[node.tagName])
	) {
		offset = domUtils.getNodeIndex(node) + (toStart ? 0 : 1);
		node = node.parentNode;
	}

	if (toStart) {
		range.startContainer = node;
		range.startOffset = offset;
		if (!range.endContainer) {
			range.collapse(true);
		}
	} else {
		range.endContainer = node;
		range.endOffset = offset;
		if (!range.startContainer) {
			range.collapse(false);
		}
	}
	updateCollapse(range);
	return range;
}

function execContentsAction(range, action) {
	//调整边界
	//range.includeBookmark();
	var start = range.startContainer,
		end = range.endContainer,
		startOffset = range.startOffset,
		endOffset = range.endOffset,
		doc = document,
		frag = doc.createDocumentFragment(),
		tmpStart,
		tmpEnd;
	if (start.nodeType == 1) {
		start =
			start.childNodes[startOffset] ||
			(tmpStart = start.appendChild(doc.createTextNode("")));
	}
	if (end.nodeType == 1) {
		end =
			end.childNodes[endOffset] ||
			(tmpEnd = end.appendChild(doc.createTextNode("")));
	}
	if (start === end && start.nodeType == 3) {
		frag.appendChild(
			doc.createTextNode(
				start.substringData(startOffset, endOffset - startOffset)
			)
		);
		//is not clone
		if (action) {
			start.deleteData(startOffset, endOffset - startOffset);
			range.collapse(true);
		}
		return frag;
	}
	var current,
		currentLevel,
		clone = frag,
		startParents = domUtils.findParents(start, true),
		endParents = domUtils.findParents(end, true);
	for (var i = 0; startParents[i] == endParents[i];) {
		i++;
	}
	for (var j = i, si; (si = startParents[j]); j++) {
		current = si.nextSibling;
		if (si == start) {
			if (!tmpStart) {
				if (range.startContainer.nodeType == 3) {
					clone.appendChild(
						doc.createTextNode(start.nodeValue.slice(startOffset))
					);
					//is not clone
					if (action) {
						start.deleteData(
							startOffset,
							start.nodeValue.length - startOffset
						);
					}
				} else {
					clone.appendChild(!action ? start.cloneNode(true) : start);
				}
			}
		} else {
			currentLevel = si.cloneNode(false);
			clone.appendChild(currentLevel);
		}
		while (current) {
			if (current === end || current === endParents[j]) {
				break;
			}
			si = current.nextSibling;
			clone.appendChild(!action ? current.cloneNode(true) : current);
			current = si;
		}
		clone = currentLevel;
	}
	clone = frag;
	if (!startParents[i]) {
		clone.appendChild(startParents[i - 1].cloneNode(false));
		clone = clone.firstChild;
	}
	for (var j = i, ei; (ei = endParents[j]); j++) {
		current = ei.previousSibling;
		if (ei == end) {
			if (!tmpEnd && range.endContainer.nodeType == 3) {
				clone.appendChild(
					doc.createTextNode(end.substringData(0, endOffset))
				);
				//is not clone
				if (action) {
					end.deleteData(0, endOffset);
				}
			}
		} else {
			currentLevel = ei.cloneNode(false);
			clone.appendChild(currentLevel);
		}
		//如果两端同级，右边第一次已经被开始做了
		if (j != i || !startParents[i]) {
			while (current) {
				if (current === start) {
					break;
				}
				ei = current.previousSibling;
				clone.insertBefore(
					!action ? current.cloneNode(true) : current,
					clone.firstChild
				);
				current = ei;
			}
		}
		clone = currentLevel;
	}
	if (action) {
		range
			.setStartBefore(
				!endParents[i]
					? endParents[i - 1]
					: !startParents[i] ? startParents[i - 1] : endParents[i]
			)
			.collapse(true);
	}
	tmpStart && domUtils.remove(tmpStart);
	tmpEnd && domUtils.remove(tmpEnd);
	return frag;
}
var Range = (function (document) {
	var me = window;
	me.startContainer = me.startOffset = me.endContainer = me.endOffset = null;
	me.collapsed = true;
});

// 删除fillData
function removeFillData(doc, excludeNode) {
	try {
		if (fillData && domUtils.inDoc(fillData, doc)) {
			if (!fillData.nodeValue.replace(fillCharReg, "").length) {
				var tmpNode = fillData.parentNode;
				domUtils.remove(fillData);
				while (
					tmpNode &&
					domUtils.isEmptyInlineElement(tmpNode) &&
					//safari的contains有bug
					(!tmpNode.contains(excludeNode))
				) {
					fillData = tmpNode.parentNode;
					domUtils.remove(tmpNode);
					tmpNode = fillData;
				}
			} else {
				fillData.nodeValue = fillData.nodeValue.replace(fillCharReg, "");
			}
		}
	} catch (e) { }
}

// 邻近节点合并
function mergeSibling(node, dir) {
	var tmpNode;
	node = node[dir];
	while (node && domUtils.isFillChar(node)) {
		tmpNode = node[dir];
		domUtils.remove(node);
		node = tmpNode;
	}
}

Range.prototype = {
	// 将当前选区的内容提取到一个DocumentFragment里
	extractContents: function () {
		return this.collapsed ? null : execContentsAction(this, 2);
	},

	// 设置Range的开始容器节点和偏移量
	setStart: function (node, offset) {
		return setEndPoint(true, node, offset, this);
	},

	// 设置Range的结束容器和偏移量
	setEnd: function (node, offset) {
		return setEndPoint(false, node, offset, this);
	},

	// 将Range开始位置设置到node节点之后
	setStartAfter: function (node) {
		return this.setStart(node.parentNode, domUtils.getNodeIndex(node) + 1);
	},

	// 将Range开始位置设置到node节点之前
	setStartBefore: function (node) {
		return this.setStart(node.parentNode, domUtils.getNodeIndex(node));
	},

	// 将Range结束位置设置到node节点之后
	setEndAfter: function (node) {
		return this.setEnd(node.parentNode, domUtils.getNodeIndex(node) + 1);
	},

	// 将Range结束位置设置到node节点之前
	setEndBefore: function (node) {
		return this.setEnd(node.parentNode, domUtils.getNodeIndex(node));
	},

	// clone当前Range对象
	cloneRange: function () {
		var me = this;
		return new Range(me.document)
			.setStart(me.startContainer, me.startOffset)
			.setEnd(me.endContainer, me.endOffset);
	},

	// 向当前选区的结束处闭合选区
	collapse: function (toStart) {
		var me = this;
		if (toStart) {
			me.endContainer = me.startContainer;
			me.endOffset = me.startOffset;
		} else {
			me.startContainer = me.endContainer;
			me.startOffset = me.endOffset;
		}
		me.collapsed = true;
		return me;
	},

	// 调整range的开始位置和结束位置，使其"收缩"到最小的位置
	shrinkBoundary: function (ignoreEnd) {
		var me = this,
			child,
			collapsed = me.collapsed;
		function check(node) {
			return (
				node.nodeType == 1 &&
				!domUtils.isBookmarkNode(node) &&
				!dtd.$empty[node.tagName] &&
				!dtd.$nonChild[node.tagName]
			);
		}
		while (
			me.startContainer.nodeType == 1 && //是element
			(child = me.startContainer.childNodes[me.startOffset]) && //子节点也是element
			check(child)
		) {
			me.setStart(child, 0);
		}
		if (collapsed) {
			return me.collapse(true);
		}
		if (!ignoreEnd) {
			while (
				me.endContainer.nodeType == 1 && //是element
				me.endOffset > 0 && //如果是空元素就退出 endOffset=0那么endOffst-1为负值，childNodes[endOffset]报错
				(child = me.endContainer.childNodes[me.endOffset - 1]) && //子节点也是element
				check(child)
			) {
				me.setEnd(child, child.childNodes.length);
			}
		}
		return me;
	},

	// 调整当前Range的开始和结束边界容器，如果是容器节点是文本节点,就调整到包含该文本节点的父节点上
	trimBoundary: function (ignoreEnd) {
		this.txtToElmBoundary();
		var start = this.startContainer,
			offset = this.startOffset,
			collapsed = this.collapsed,
			end = this.endContainer;
		if (start.nodeType == 3) {
			if (offset == 0) {
				this.setStartBefore(start);
			} else {
				if (offset >= start.nodeValue.length) {
					this.setStartAfter(start);
				} else {
					var textNode = domUtils.split(start, offset);
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
			offset = this.endOffset;
			end = this.endContainer;
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
	},

	// 如果选区在文本的边界上，就扩展选区到文本的父节点上, 如果当前选区是闭合的， 则什么也不做
	txtToElmBoundary: function (ignoreCollapsed) {
		function adjust(r, c) {
			var container = r[c + "Container"],
				offset = r[c + "Offset"];
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
	},

	// 在当前选区的开始位置前插入节点，新插入的节点会被该range包含
	insertNode: function (node) {
		var first = node,
			length = 1;
		if (node.nodeType == 11) {
			first = node.firstChild;
			length = node.childNodes.length;
		}
		this.trimBoundary(true);
		var start = this.startContainer,
			offset = this.startOffset;
		var nextNode = start.childNodes[offset];
		if (nextNode) {
			start.insertBefore(node, nextNode);
		} else {
			start.appendChild(node);
		}
		if (first.parentNode === this.endContainer) {
			this.endOffset = this.endOffset + length;
		}
		return this.setStartBefore(first);
	},

	// 创建当前range的一个书签，记录下当前range的位置，方便当dom树改变时，还能找回原来的选区位置
	createBookmark: function (serialize, same) {
		var endNode,
			startNode = document.createElement("span");
		startNode.style.cssText = "display:none;line-height:0px;";
		startNode.appendChild(document.createTextNode("\u200D"));
		startNode.id = "_baidu_bookmark_start_" + (same ? "" : guid++);

		if (!this.collapsed) {
			endNode = startNode.cloneNode(true);
			endNode.id = "_baidu_bookmark_end_" + (same ? "" : guid++);
		}
		this.insertNode(startNode);
		if (endNode) {
			this.collapse().insertNode(endNode).setEndBefore(endNode);
		}
		this.setStartAfter(startNode);
		return {
			start: serialize ? startNode.id : startNode,
			end: endNode ? (serialize ? endNode.id : endNode) : null,
			id: serialize
		};
	},

	// 调整当前range的边界到书签位置，并删除该书签对象所标记的位置内的节点
	moveToBookmark: function (bookmark) {
		var start = bookmark.id
			? document.getElementById(bookmark.start)
			: bookmark.start,
			end = bookmark.end && bookmark.id
				? document.getElementById(bookmark.end)
				: bookmark.end;
		this.setStartBefore(start);
		domUtils.remove(start);
		if (end) {
			this.setEndBefore(end);
			domUtils.remove(end);
		} else {
			this.collapse(true);
		}
		return this;
	},

	enlarge: function (toBlock, stopFn) {
		var isBody = domUtils.isBody,
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
				if (domUtils.isBlockElm(node)) {
					node = pre;
					while ((pre = node.previousSibling) && !domUtils.isBlockElm(pre)) {
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
				if (domUtils.isBlockElm(node)) {
					node = pre;
					while ((pre = node.nextSibling) && !domUtils.isBlockElm(pre)) {
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
				this.endOffset ==
				(this.endContainer.nodeType == 1
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
	},

	// 调整Range的边界，使其"缩小"到最合适的位置
	adjustmentBoundary: function () {
		if (!this.collapsed) {
			while (
				!domUtils.isBody(this.startContainer) &&
				this.startOffset ==
				this.startContainer[
					this.startContainer.nodeType == 3 ? "nodeValue" : "childNodes"
				].length &&
				this.startContainer[
					this.startContainer.nodeType == 3 ? "nodeValue" : "childNodes"
				].length
			) {
				this.setStartAfter(this.startContainer);
			}
			while (
				!domUtils.isBody(this.endContainer) &&
				!this.endOffset &&
				this.endContainer[
					this.endContainer.nodeType == 3 ? "nodeValue" : "childNodes"
				].length
			) {
				this.setEndBefore(this.endContainer);
			}
		}
		return this;
	},

	applyInlineStyle: function (tagName, attrs, list) {
		if (this.collapsed) return this;
		this.trimBoundary()
			.enlarge(false, function (node) {
				return node.nodeType == 1 && domUtils.isBlockElm(node);
			})
			.adjustmentBoundary();
		var bookmark = this.createBookmark(),
			end = bookmark.end,
			filterFn = function (node) {
				return node.nodeType == 1
					? node.tagName.toLowerCase() != "br"
					: !domUtils.isWhitespace(node);
			},
			current = domUtils.getNextDomNode(bookmark.start, false, filterFn),
			node,
			pre,
			range = this.cloneRange();
		while (
			current &&
			domUtils.getPosition(current, end) & domUtils.POSITION_PRECEDING
		) {
			if (current.nodeType == 3 || dtd[tagName][current.tagName]) {
				range.setStartBefore(current);
				node = current;
				while (
					node &&
					(node.nodeType == 3 || dtd[tagName][node.tagName]) &&
					node !== end
				) {
					pre = node;
					node = domUtils.getNextDomNode(
						node,
						node.nodeType == 1,
						null,
						function (parent) {
							return dtd[tagName][parent.tagName];
						}
					);
				}
				var frag = range.setEndAfter(pre).extractContents(),
					elm;
				if (list && list.length > 0) {
					var level, top;
					top = level = list[0].cloneNode(false);
					for (var i = 1, ci; (ci = list[i++]);) {
						level.appendChild(ci.cloneNode(false));
						level = level.firstChild;
					}
					elm = level;
				} else {
					elm = document.createElement(tagName);
				}
				if (attrs) {
					domUtils.setAttributes(elm, attrs);
				}
				elm.appendChild(frag);
				//针对嵌套span的全局样式指定，做容错处理
				if (elm.tagName == "SPAN" && attrs && attrs.style) {
					utils.each(elm.getElementsByTagName("span"), function (s) {
						s.style.cssText = s.style.cssText + ";" + attrs.style;
					});
				}
				range.insertNode(list ? top : elm);
				//处理下滑线在a上的情况
				var aNode;
				if (
					tagName == "span" &&
					attrs.style &&
					/text\-decoration/.test(attrs.style) &&
					(aNode = domUtils.findParentByTagName(elm, "a", true))
				) {
					domUtils.setAttributes(aNode, attrs);
					domUtils.remove(elm, true);
					elm = aNode;
				} else {
					domUtils.mergeSibling(elm);
					domUtils.clearEmptySibling(elm);
				}
				//去除子节点相同的
				domUtils.mergeChild(elm, attrs);
				current = domUtils.getNextDomNode(elm, false, filterFn);
				domUtils.mergeToParent(elm);
				if (node === end) {
					break;
				}
			} else {
				current = domUtils.getNextDomNode(current, true, filterFn);
			}
		}
		return this.moveToBookmark(bookmark);
	},

	removeInlineStyle: function (tagNames, className) {
		if (this.collapsed) return this;
		tagNames = utils.isArray(tagNames) ? tagNames : [tagNames];
		this.shrinkBoundary().adjustmentBoundary();
		var start = this.startContainer,
			end = this.endContainer;
		while (1) {
			if (start.nodeType == 1) {
				if (utils.indexOf(tagNames, start.tagName.toLowerCase()) > -1) {
					break;
				}
				if (start.tagName.toLowerCase() == "body") {
					start = null;
					break;
				}
			}
			start = start.parentNode;
		}
		while (1) {
			if (end.nodeType == 1) {
				if (utils.indexOf(tagNames, end.tagName.toLowerCase()) > -1) {
					break;
				}
				if (end.tagName.toLowerCase() == "body") {
					end = null;
					break;
				}
			}
			end = end.parentNode;
		}
		var bookmark = this.createBookmark(),
			frag,
			tmpRange;
		if (start) {
			tmpRange = this.cloneRange()
				.setEndBefore(bookmark.start)
				.setStartBefore(start);
			frag = tmpRange.extractContents();
			tmpRange.insertNode(frag);
			domUtils.clearEmptySibling(start, true);
			start.parentNode.insertBefore(bookmark.start, start);
		}
		if (end) {
			tmpRange = this.cloneRange()
				.setStartAfter(bookmark.end)
				.setEndAfter(end);
			frag = tmpRange.extractContents();
			tmpRange.insertNode(frag);
			domUtils.clearEmptySibling(end, false, true);
			end.parentNode.insertBefore(bookmark.end, end.nextSibling);
		}
		var current = domUtils.getNextDomNode(bookmark.start, false, function (
			node
		) {
			return node.nodeType == 1;
		}),
			next;
		while (current && current !== bookmark.end) {
			next = domUtils.getNextDomNode(current, true, function (node) {
				return node.nodeType == 1;
			});
			if (utils.indexOf(tagNames, current.tagName.toLowerCase()) > -1 && current.className === className) {
				domUtils.remove(current, true);
			}
			current = next;
		}
		return this.moveToBookmark(bookmark);
	},

	getClosedNode: function () {
		var node;
		if (!this.collapsed) {
			var range = this.cloneRange().adjustmentBoundary().shrinkBoundary();
			if (selectOneNode(range)) {
				var child = range.startContainer.childNodes[range.startOffset];
				if (
					child &&
					child.nodeType == 1 &&
					(dtd.$empty[child.tagName] || dtd.$nonChild[child.tagName])
				) {
					node = child;
				}
			}
		}
		return node;
	},
	
	select: browser.ie
		? function (noFillData, textRange) {
			var nativeRange;
			if (!this.collapsed) this.shrinkBoundary();
			var node = this.getClosedNode();
			if (node && !textRange) {
				try {
					nativeRange = document.body.createControlRange();
					nativeRange.addElement(node);
					nativeRange.select();
				} catch (e) { }
				return this;
			}
			var bookmark = this.createBookmark(),
				start = bookmark.start,
				end;
			nativeRange = document.body.createTextRange();
			nativeRange.moveToElementText(start);
			nativeRange.moveStart("character", 1);
			if (!this.collapsed) {
				var nativeRangeEnd = document.body.createTextRange();
				end = bookmark.end;
				nativeRangeEnd.moveToElementText(end);
				nativeRange.setEndPoint("EndToEnd", nativeRangeEnd);
			} else {
				if (!noFillData && this.startContainer.nodeType != 3) {
					//使用<span>|x<span>固定住光标
					var tmpText = document.createTextNode(fillChar),
						tmp = document.createElement("span");
					tmp.appendChild(document.createTextNode(fillChar));
					start.parentNode.insertBefore(tmp, start);
					start.parentNode.insertBefore(tmpText, start);
					//当点b,i,u时，不能清除i上边的b
					removeFillData(document, tmpText);
					fillData = tmpText;
					mergeSibling(tmp, "previousSibling");
					mergeSibling(start, "nextSibling");
					nativeRange.moveStart("character", -1);
					nativeRange.collapse(true);
				}
			}
			this.moveToBookmark(bookmark);
			tmp && domUtils.remove(tmp);
			//IE在隐藏状态下不支持range操作，catch一下
			try {
				nativeRange.select();
			} catch (e) { }
			return this;
		}
		: function (notInsertFillData) {
			function checkOffset(rng) {
				function check(node, offset, dir) {
					if (node.nodeType == 3 && node.nodeValue.length < offset) {
						rng[dir + "Offset"] = node.nodeValue.length;
					}
				}
				check(rng.startContainer, rng.startOffset, "start");
				check(rng.endContainer, rng.endOffset, "end");
			}
			var win = window,
				sel = win.getSelection(),
				txtNode;
			//FF下关闭自动长高时滚动条在关闭dialog时会跳
			//ff下如果不body.focus将不能定位闭合光标到编辑器内
			browser.gecko ? document.body.focus() : win.focus();
			if (sel) {
				sel.removeAllRanges();
				// trace:870 chrome/safari后边是br对于闭合得range不能定位 所以去掉了判断
				// this.startContainer.nodeType != 3 &&! ((child = this.startContainer.childNodes[this.startOffset]) && child.nodeType == 1 && child.tagName == 'BR'
				if (this.collapsed && !notInsertFillData) {
					var start = this.startContainer,
						child = start;
					if (start.nodeType == 1) {
						child = start.childNodes[this.startOffset];
					}
					if (
						!(start.nodeType == 3 && this.startOffset) &&
						(child
							? !child.previousSibling ||
							child.previousSibling.nodeType != 3
							: !start.lastChild || start.lastChild.nodeType != 3)
					) {
						txtNode = document.createTextNode(fillChar);
						//跟着前边走
						this.insertNode(txtNode);
						removeFillData(document, txtNode);
						mergeSibling(txtNode, "previousSibling");
						mergeSibling(txtNode, "nextSibling");
						fillData = txtNode;
						this.setStart(txtNode, browser.webkit ? 1 : 0).collapse(true);
					}
				}
				var nativeRange = document.createRange();
				if (
					this.collapsed &&
					browser.opera &&
					this.startContainer.nodeType == 1
				) {
					var child = this.startContainer.childNodes[this.startOffset];
					if (!child) {
						//往前靠拢
						child = this.startContainer.lastChild;
						if (child && domUtils.isBr(child)) {
							this.setStartBefore(child).collapse(true);
						}
					} else {
						//向后靠拢
						while (child && domUtils.isBlockElm(child)) {
							if (child.nodeType == 1 && child.childNodes[0]) {
								child = child.childNodes[0];
							} else {
								break;
							}
						}
						child && this.setStartBefore(child).collapse(true);
					}
				}
				//是createAddress最后一位算的不准，现在这里进行微调
				checkOffset(this);
				nativeRange.setStart(this.startContainer, this.startOffset);
				nativeRange.setEnd(this.endContainer, this.endOffset);
				sel.addRange(nativeRange);
			}
			return this;
		}
};

export default Range;
