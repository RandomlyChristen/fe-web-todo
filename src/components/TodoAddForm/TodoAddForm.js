import Component from "../../core/Component.js";

class TodoAddForm extends Component {
    initialize() {
        this.addEvent('keyup', '.todoaddform-name', this.checkInput.bind(this));
        this.addEvent('click', '.ok-btn', this.okClicked.bind(this));
        this.addEvent('click', '.cancel-btn, .todoaddform-bgbtn', this.cancelClicked.bind(this));
    }

    okClicked() {
        const { addTodo } = this.props;
        const name = this.$target.querySelector('.todoaddform-name').value;
        const desc = this.$target.querySelector('.todoaddform-desc').value;
        addTodo(name, desc);
        setTimeout(() => {this.clearInput()}, 1000);
    }

    cancelClicked() {
        const { addCancel } = this.props;
        addCancel();
        this.clearInput();
    }

    clearInput() {
        const $name = this.$target.querySelector('.todoaddform-name');
        const $desc = this.$target.querySelector('.todoaddform-desc');
        const $okBtn = this.$target.querySelector('.ok-btn');
        $name.value = '';
        $desc.value = '';
        $okBtn.setAttribute('disabled', 'true');
    }

    checkInput() {
        const $name = this.$target.querySelector('.todoaddform-name');
        const $okBtn = this.$target.querySelector('.ok-btn');
        if ($name.value.length) {
            $okBtn.removeAttribute('disabled');
        } else {
            $okBtn.setAttribute('disabled', 'true');
        }
    }

    template() {
        return `
        <button class="todoaddform-bgbtn"></button>
        <div class="todoaddform-fgarea">
            <input class="todoaddform-name" type="text" placeholder="제목을 입력하세요">
            <textarea class="todoaddform-desc" placeholder="내용을 입력하세요"></textarea>
            <div>
                <button class="cancel-btn">취소</button>
                <button class="ok-btn" disabled>등록</button>
            </div>
        </div>
        `
    }
}

export default TodoAddForm;