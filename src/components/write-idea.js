import { h } from './element';

class WriteIdea{
    constructor() {}

    render() {
        let write_review = h('div', 'writeReview');
        let container = `
        <div class="readerWriteReviewPanel_bg">
            <span class="closeButton">关闭</span>
            <div class="writeReview_container">
                <div class="writeReview_editor">
                    <span class="writeReview_icon"></span>
                    <textarea name="WriteBookReview" id="WriteBookReview" placeholder="写下这一刻的想法" class="writeReview_textarea"></textarea>
                </div>

                <div class="writeReview_footer">
                    <div class="writeReview_footer_Border">
                        <div class="menu_container">
                            <div class="writeReview_private_button" id="privateBtn">
                                <span class="button_leftIcon"></span>
                                <span class="button_text">公开</span>
                                <span class="button_rightIcon"></span>
                            </div>
                            <div class="menu_option_container">
                                <ul>
                                    <li>
                                        <span class="writeReview_footer_Menu_Icon publish"></span>
                                        <span class="writeReview_footer_Menu_Title">公开</span>
                                        <span class="writeReview_footer_Menu_Subtitle">所有人可见</span>
                                    </li>
                                    <li>
                                        <span class="writeReview_footer_Menu_Icon follow"></span>
                                        <span class="writeReview_footer_Menu_Title">关注</span>
                                        <span class="writeReview_footer_Menu_Subtitle">仅互相关注可见</span>
                                    </li>
                                    <li>
                                        <span class="writeReview_footer_Menu_Icon secret"></span>
                                        <span class="writeReview_footer_Menu_Title">私密</span>
                                        <span class="writeReview_footer_Menu_Subtitle">仅自己可见</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <button class="writeReview_submit_button">发 表</button>
                        <div class="writeReview_footer_Clear"></div>
                    </div>
                </div>
            </div>
        </div>
        `;

        write_review.el.innerHTML = container;

        this.mouseEvent();

        return write_review.el;
    }

    isShow(target) {
        return target.style('display') !== 'none';
    }

    // 设置显示
    show() {
        this.el.show();
        return this;
    }

    // 设置隐藏
    hide() {
        this.el.hide();
        return this;
    }

    // 事件函数
    mouseEvent() {
        this.toggle();
    }

    // 公开按钮点击事件
    toggle() {
        // console.log(document.getElementsByClassName('writeReview_private_button'))
        // document.getElementsByClassName('writeReview_private_button').onclick = function(e) {
        //     alert("ahaha")
        // }

        var btn = document.getElementById('privateBtn');
        btn.click(() => {
            alert("ahah")
        })
    }


}

export { 
    WriteIdea 
};