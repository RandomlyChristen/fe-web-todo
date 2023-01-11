import Component from "../../core/Component.js";
import TodoDatabase from "../../persistance/TodoDatabase.js";

class TodoCard extends Component {
    initialize() {
        const { todoId } = this.props;
        const todo = TodoDatabase.findTodoById(todoId);
        this.state = {
            todo: todo,
            isEdit: false
        }
        this.addEvent('dblclick', '.todocard-dblclick-area', this.startEdit.bind(this));
        this.addEvent('click', '.todocard-edit-cancel', this.cancelEdit.bind(this));
        this.addEvent('click', '.todocard-edit-ok', this.finishEdit.bind(this));
        this.addEvent('click', '.todocard-bgbtn', this.cancelEdit.bind(this));
    }

    template() {
        const { todo, isEdit } = this.state;
        return `
        <button class="todocard-bgbtn"></button>
        <div class="todocard-dblclick-area">
            <div class="todocard-header">
                <input class="todocard-title" value="${todo.name}" ${isEdit || 'disabled'}>
                <button class="todocard-delete" ${!isEdit || 'disabled'}>
                    <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 11.25L0.75 10.5L5.25 6L0.75 1.5L1.5 0.750004L6 5.25L10.5 0.750004L11.25 1.5L6.75 6L11.25 10.5L10.5 11.25L6 6.75L1.5 11.25Z"/>
                    </svg>
                </button>            
            </div>
            ${isEdit ?
            `<textarea class="todocard-desc">${todo.description}</textarea>` :
            `<pre class="todocard-desc">${todo.description}</pre>`
            }
            <p class="todocard-author">author by ${todo.author}</p>
            <div class="todocard-btn-area">
                <button class="todocard-edit-cancel">취소</button>
                <button class="todocard-edit-ok">수정</button>
            </div>        
        </div>
        `
    }

    mounted() {
        this.renderDraggable();
        this.renderEdit();
        this.fitHeight();
    }

    startEdit() {
        this.setState({ isEdit: true });
    }
    cancelEdit() {
        this.setState({ isEdit: false });
    }
    finishEdit() {
        const $title = this.$target.querySelector('.todocard-title');
        const $desc = this.$target.querySelector('.todocard-desc');
        const newTodo = {
            ...this.state.todo,
            name: $title.value,
            description: $desc.value
        };
        this.setState({
            isEdit: false,
            todo: newTodo
        });
        TodoDatabase.updateTodo(newTodo);
    }
    fitHeight() {
        const $textarea = this.$target.querySelector('.todocard-desc');
        $textarea.style.height = `${$textarea.scrollHeight}px`;
    }
    renderDraggable() {
        this.$target.draggable = !this.state.isEdit;
    }
    renderEdit() {
        if (this.state.isEdit) {
            this.$target.classList.add('edit');
        } else {
            this.$target.classList.remove('edit');
        }
    }
}

export default TodoCard;