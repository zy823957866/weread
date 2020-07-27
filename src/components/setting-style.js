import Range from './range';

class SettingStyle{
    constructor() {
        // 设置selector
        // this.selector = new Selector();
     }

    // 复制信息
    copy() {
        console.log('您点击了复制');
    }

    // 马克笔
    underlineBg() {
        console.log('您点击了马克笔');
    }

    // 波浪线
    underlineHandWrite() {
        console.log('您点击了波浪线');
    }

    // 直线
    underlineStraight() {
        this.replaceTxt('txt_underline');
    }

    // 删除下划线
    removeUnderline() {
        console.log('您点击了删除下划线');
    }

    // 写想法
    review() {
        console.log('您点击了写想法');
    }

    // 查询
    query() {
        console.log('您点击了查询');
    }

    // 文本替换页面元素
    replaceTxt(className = '') {
        // var getRange = () => {
        //     var me = window;
        //     var range = new Range(me.document);
            
        //     var sel =window.getSelection();
            
        //     if (sel && sel.rangeCount) {
        //     var firstRange = sel.getRangeAt(0);
        //     var lastRange = sel.getRangeAt(sel.rangeCount - 1);
            
        //     range.setStart(firstRange.startContainer, firstRange.startOffset)
        //         .setEnd(lastRange.endContainer, lastRange.endOffset);
        //     }

        //     return range;
        // }
        // var range = getRange();

        // let classNames = '';
        
        // if(className != 'aa'){
        //     classNames= className + ' active';
        // }else{
        //     classNames= className;
        // }
        
        // range.applyInlineStyle('i', {
        //     class: classNames
        // });

        // if(className != 'aa'){
            
        //     for(var i=0;i<document.getElementsByClassName('active').length;i++){
        //         document.getElementsByClassName('active')[i].setAttribute("onclick","clicks(this,className)"); 
        //     }
        // }
        // range.select();


    }
}

export { SettingStyle };
