/**
 * 创建元素
 * @param tag 标签类型
 * @param className
 */

class Element {
    constructor(tag, className='') {
        if (typeof tag === 'string') {
            this.el = document.createElement(tag);
            this.el.className = className;
        }else {
            this.el = tag;
        }
    }

    // 鼠标事件
    on(eventNames, handler) {
        this.el.addEventListener(eventNames, (evt) => {
            handler(evt);
        });

        return this;
    }

    // 添加class
    addClass(name) {
        this.el.classList.add(name);
        return this;
    }

    // 删除class
    removeClass(name) {
        this.el.classList.remove(name);
        return this;
    }

    // 是否有某个class
    hasClass(name) {
        return this.el.classList.contains(name);
    }

    // 设置html
    html(content) {
        if (content !== undefined) {
            this.el.innerHTML = content;
            return this;
        }
        return this.el.innerHTML;
    }

    // 设置子元素
    children(...els){
        els.forEach(it => {
            this.el.appendChild(it.el)
        })

        return this.el;
    }

    // 设置属性
    attr(key, value) {
        if (value !== undefined) {
            this.el.setAttribute(key, value);
        } else {
            if (typeof key === 'string') {
                return this.el.getAttribute(key);
            }
            Object.keys(key).forEach((k) => {
                this.el.setAttribute(k, key[k]);
            });
        }
        return this;
    }

    // 

}

const h = (tag, className = '') => new Element(tag, className);

export {
    Element,
    h
}